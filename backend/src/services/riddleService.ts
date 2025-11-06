import {
  DynamoDBClient,
  QueryCommand,
  GetItemCommand,
  UpdateItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand as DocQueryCommand,
  GetCommand,
  UpdateCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { cloudWatchService } from "./cloudWatchService";
import { sesService } from "./sesService";
import { cognitoService } from "./cognitoService";

// AWS Configuration
const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {
  region: process.env.AWS_REGION || "us-east-1",
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const dynamoClient = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const RIDDLES_TABLE = process.env.RIDDLES_TABLE_NAME || "GothamRiddles";
const PROGRESS_TABLE = process.env.PROGRESS_TABLE_NAME || "PlayerProgress";

export interface Riddle {
  riddleId: string;
  levelId: number;
  question: string;
  answer: string;
  hint?: string;
  type: string;
  difficulty: "easy" | "medium" | "hard";
  metadata?: any;
}

export interface PlayerProgress {
  playerId: string;
  solvedRiddleIds: string[];
  currentDifficulty: "easy" | "medium" | "hard";
  lastPlayedTimestamp: string;
  levelProgress: Record<
    number,
    {
      completed: boolean;
      bestStars: number;
      attempts: number;
      bestTime?: number;
    }
  >;
  totalScore: number;
  achievements: string[];
}

export interface RiddleRequest {
  playerId: string;
  levelId?: number;
  difficulty?: "easy" | "medium" | "hard";
  type?: string;
  excludeSolved?: boolean;
}

export interface RiddleResponse {
  riddle: Riddle;
  isNew: boolean;
  playerProgress: PlayerProgress;
  nextRiddleHint?: string;
}

export class RiddleService {
  /**
   * Get riddles for a specific level
   */
  async getRiddlesByLevel(levelId: number): Promise<Riddle[]> {
    try {
      const result = await docClient.send(
        new DocQueryCommand({
          TableName: RIDDLES_TABLE,
          IndexName: "LevelIndex",
          KeyConditionExpression: "levelId = :levelId",
          FilterExpression: "isActive = :isActive",
          ExpressionAttributeValues: {
            ":levelId": levelId,
            ":isActive": true,
          },
        })
      );

      return (result.Items as Riddle[]) || [];
    } catch (error: any) {
      console.error("Get riddles by level error:", error);
      throw new Error(
        `Failed to get riddles for level ${levelId}: ${error.message}`
      );
    }
  }

  /**
   * Get riddles by difficulty
   */
  async getRiddlesByDifficulty(
    difficulty: "easy" | "medium" | "hard"
  ): Promise<Riddle[]> {
    try {
      const result = await docClient.send(
        new DocQueryCommand({
          TableName: RIDDLES_TABLE,
          IndexName: "DifficultyIndex",
          KeyConditionExpression: "difficulty = :difficulty",
          FilterExpression: "isActive = :isActive",
          ExpressionAttributeValues: {
            ":difficulty": difficulty,
            ":isActive": true,
          },
        })
      );

      return (result.Items as Riddle[]) || [];
    } catch (error: any) {
      console.error("Get riddles by difficulty error:", error);
      throw new Error(
        `Failed to get riddles for difficulty ${difficulty}: ${error.message}`
      );
    }
  }

  /**
   * Get riddles by type
   */
  async getRiddlesByType(type: string): Promise<Riddle[]> {
    try {
      const result = await docClient.send(
        new DocQueryCommand({
          TableName: RIDDLES_TABLE,
          IndexName: "TypeIndex",
          KeyConditionExpression: "type = :type",
          FilterExpression: "isActive = :isActive",
          ExpressionAttributeValues: {
            ":type": type,
            ":isActive": true,
          },
        })
      );

      return (result.Items as Riddle[]) || [];
    } catch (error: any) {
      console.error("Get riddles by type error:", error);
      throw new Error(
        `Failed to get riddles for type ${type}: ${error.message}`
      );
    }
  }

  /**
   * Get a random unsolved riddle for a player
   */
  async getRandomRiddle(request: RiddleRequest): Promise<RiddleResponse> {
    const startTime = Date.now();

    try {
      // Log riddle request
      await cloudWatchService.logRiddleRequest(
        request.playerId,
        request.levelId,
        request.difficulty,
        request.type
      );

      // Get player progress
      const playerProgress = await this.getPlayerProgress(request.playerId);

      // Get available riddles based on filters
      let availableRiddles: Riddle[] = [];

      if (request.levelId) {
        availableRiddles = await this.getRiddlesByLevel(request.levelId);
      } else if (request.difficulty) {
        availableRiddles = await this.getRiddlesByDifficulty(
          request.difficulty
        );
      } else if (request.type) {
        availableRiddles = await this.getRiddlesByType(request.type);
      } else {
        // Get all riddles
        availableRiddles = await this.getAllRiddles();
      }

      // Filter out solved riddles if requested
      if (request.excludeSolved !== false) {
        availableRiddles = availableRiddles.filter(
          (riddle) => !playerProgress.solvedRiddleIds.includes(riddle.riddleId)
        );
      }

      if (availableRiddles.length === 0) {
        throw new Error("No available riddles found for the given criteria");
      }

      // Select random riddle
      const randomIndex = Math.floor(Math.random() * availableRiddles.length);
      const selectedRiddle = availableRiddles[randomIndex];

      // Check if this is a new riddle for the player
      const isNew = !playerProgress.solvedRiddleIds.includes(
        selectedRiddle.riddleId
      );

      // Send metrics
      await cloudWatchService.sendRiddleRequestMetric(
        selectedRiddle.levelId,
        selectedRiddle.difficulty
      );

      // Log performance
      const duration = Date.now() - startTime;
      await cloudWatchService.sendPerformanceMetric(
        "getRandomRiddle",
        duration,
        selectedRiddle.levelId
      );

      return {
        riddle: selectedRiddle,
        isNew,
        playerProgress,
        nextRiddleHint: this.getNextRiddleHint(
          selectedRiddle,
          availableRiddles
        ),
      };
    } catch (error: any) {
      console.error("Get random riddle error:", error);

      // Log error
      await cloudWatchService.logError(error, {
        operation: "getRandomRiddle",
        playerId: request.playerId,
        levelId: request.levelId,
        difficulty: request.difficulty,
        type: request.type,
      });

      // Send error metric
      await cloudWatchService.sendErrorMetric(
        "RiddleRetrievalError",
        request.levelId
      );

      throw new Error(`Failed to get random riddle: ${error.message}`);
    }
  }

  /**
   * Get all riddles (for admin purposes)
   */
  async getAllRiddles(): Promise<Riddle[]> {
    try {
      const result = await docClient.send(
        new DocQueryCommand({
          TableName: RIDDLES_TABLE,
          FilterExpression: "isActive = :isActive",
          ExpressionAttributeValues: {
            ":isActive": true,
          },
        })
      );

      return (result.Items as Riddle[]) || [];
    } catch (error: any) {
      console.error("Get all riddles error:", error);
      throw new Error(`Failed to get all riddles: ${error.message}`);
    }
  }

  /**
   * Get player progress
   */
  async getPlayerProgress(playerId: string): Promise<PlayerProgress> {
    try {
      const result = await docClient.send(
        new GetCommand({
          TableName: PROGRESS_TABLE,
          Key: {
            playerId,
          },
        })
      );

      if (result.Item) {
        return result.Item as PlayerProgress;
      }

      // Create new player progress if doesn't exist
      const newProgress: PlayerProgress = {
        playerId,
        solvedRiddleIds: [],
        currentDifficulty: "easy",
        lastPlayedTimestamp: new Date().toISOString(),
        levelProgress: {},
        totalScore: 0,
        achievements: [],
      };

      await this.createPlayerProgress(newProgress);
      return newProgress;
    } catch (error: any) {
      console.error("Get player progress error:", error);
      throw new Error(`Failed to get player progress: ${error.message}`);
    }
  }

  /**
   * Create new player progress
   */
  async createPlayerProgress(progress: PlayerProgress): Promise<void> {
    try {
      await docClient.send(
        new PutCommand({
          TableName: PROGRESS_TABLE,
          Item: progress,
        })
      );
    } catch (error: any) {
      console.error("Create player progress error:", error);
      throw new Error(`Failed to create player progress: ${error.message}`);
    }
  }

  /**
   * Update player progress when riddle is solved
   */
  async updatePlayerProgress(
    playerId: string,
    riddleId: string,
    levelId: number,
    stars: number,
    completionTime?: number
  ): Promise<PlayerProgress> {
    try {
      const progress = await this.getPlayerProgress(playerId);

      // Add riddle to solved list if not already there
      if (!progress.solvedRiddleIds.includes(riddleId)) {
        progress.solvedRiddleIds.push(riddleId);
      }

      // Update level progress
      if (!progress.levelProgress[levelId]) {
        progress.levelProgress[levelId] = {
          completed: false,
          bestStars: 0,
          attempts: 0,
        };
      }

      const levelProgress = progress.levelProgress[levelId];
      levelProgress.attempts += 1;

      if (stars > levelProgress.bestStars) {
        levelProgress.bestStars = stars;
      }

      if (
        completionTime &&
        (!levelProgress.bestTime || completionTime < levelProgress.bestTime)
      ) {
        levelProgress.bestTime = completionTime;
      }

      if (stars > 0) {
        levelProgress.completed = true;
      }

      // Update total score
      progress.totalScore = Object.values(progress.levelProgress).reduce(
        (sum, level) => sum + level.bestStars,
        0
      );

      // Update difficulty based on performance
      progress.currentDifficulty = this.calculatePlayerDifficulty(progress);

      // Update last played timestamp
      progress.lastPlayedTimestamp = new Date().toISOString();

      // Save updated progress
      await docClient.send(
        new PutCommand({
          TableName: PROGRESS_TABLE,
          Item: progress,
        })
      );

      // Log completion and send metrics
      await cloudWatchService.logRiddleCompletion(
        playerId,
        riddleId,
        levelId,
        stars,
        completionTime || 0
      );

      await cloudWatchService.sendRiddleCompletionMetric(
        levelId,
        stars,
        completionTime || 0
      );

      // Congratulate player if all 5 levels are completed
      try {
        const completedLevels = Object.entries(progress.levelProgress)
          .filter(([_, lvl]) => (lvl as any).completed)
          .map(([k]) => parseInt(k, 10));
        const uniqueCompleted = new Set(completedLevels);
        if (
          uniqueCompleted.has(1) &&
          uniqueCompleted.has(2) &&
          uniqueCompleted.has(3) &&
          uniqueCompleted.has(4) &&
          uniqueCompleted.has(5)
        ) {
          console.log("All levels completed. Triggering SES congratulation...");
          const email = await cognitoService.getUserEmailBySub(playerId);
          if (email) {
            await sesService.sendCongratsMessage(email);
          } else {
            console.warn(
              "No email found for player, cannot send congrats email",
              { playerId }
            );
          }
        }
      } catch (e) {
        console.warn("Failed to send congratulation email (non-fatal):", e);
      }

      return progress;
    } catch (error: any) {
      console.error("Update player progress error:", error);

      // Log error
      await cloudWatchService.logError(error, {
        operation: "updatePlayerProgress",
        playerId,
        riddleId,
        levelId,
        stars,
        completionTime,
      });

      // Send error metric
      await cloudWatchService.sendErrorMetric("ProgressUpdateError", levelId);

      throw new Error(`Failed to update player progress: ${error.message}`);
    }
  }

  /**
   * Calculate player difficulty based on performance
   */
  private calculatePlayerDifficulty(
    progress: PlayerProgress
  ): "easy" | "medium" | "hard" {
    const completedLevels = Object.values(progress.levelProgress).filter(
      (level) => level.completed
    ).length;

    const averageStars = progress.totalScore / Math.max(completedLevels, 1);

    if (completedLevels >= 3 && averageStars >= 2.5) {
      return "hard";
    } else if (completedLevels >= 1 && averageStars >= 1.5) {
      return "medium";
    } else {
      return "easy";
    }
  }

  /**
   * Get hint for next riddle
   */
  private getNextRiddleHint(
    currentRiddle: Riddle,
    availableRiddles: Riddle[]
  ): string | undefined {
    const nextRiddles = availableRiddles.filter(
      (r) => r.riddleId !== currentRiddle.riddleId
    );
    if (nextRiddles.length > 0) {
      const nextRiddle =
        nextRiddles[Math.floor(Math.random() * nextRiddles.length)];
      return `Next: ${nextRiddle.type} puzzle in ${nextRiddle.difficulty} difficulty`;
    }
    return undefined;
  }

  /**
   * Validate riddle answer via exact match (case-insensitive)
   */
  async validateAnswer(riddleId: string, userAnswer: string): Promise<boolean> {
    try {
      const result = await docClient.send(
        new GetCommand({
          TableName: RIDDLES_TABLE,
          Key: {
            riddleId,
          },
        })
      );

      if (!result.Item) {
        throw new Error("Riddle not found");
      }

      const riddle = result.Item as Riddle;

      console.log("\n" + "=".repeat(80));
      console.log("🎯 RIDDLE VALIDATION STARTED");
      console.log("=".repeat(80));
      console.log(`Riddle ID: ${riddleId}`);
      console.log(`Level: ${riddle.levelId}`);
      console.log(`Type: ${riddle.type}`);
      console.log(`Question: ${riddle.question}`);
      console.log(`Expected Answer: ${riddle.answer}`);
      console.log(`User Answer: ${userAnswer}`);
      console.log("=".repeat(80));
      console.log("");

      // Exact string matching (case-insensitive)
      const normalizedAnswer = userAnswer.trim().toUpperCase();
      const correctAnswer = riddle.answer.trim().toUpperCase();

      return normalizedAnswer === correctAnswer;
    } catch (error: any) {
      console.error("Validate answer error:", error);
      throw new Error(`Failed to validate answer: ${error.message}`);
    }
  }

  /**
   * Get riddle statistics
   */
  async getRiddleStats(): Promise<{
    totalRiddles: number;
    riddlesByDifficulty: Record<string, number>;
    riddlesByType: Record<string, number>;
    riddlesByLevel: Record<number, number>;
  }> {
    try {
      const riddles = await this.getAllRiddles();

      const stats = {
        totalRiddles: riddles.length,
        riddlesByDifficulty: {} as Record<string, number>,
        riddlesByType: {} as Record<string, number>,
        riddlesByLevel: {} as Record<number, number>,
      };

      riddles.forEach((riddle) => {
        stats.riddlesByDifficulty[riddle.difficulty] =
          (stats.riddlesByDifficulty[riddle.difficulty] || 0) + 1;
        stats.riddlesByType[riddle.type] =
          (stats.riddlesByType[riddle.type] || 0) + 1;
        stats.riddlesByLevel[riddle.levelId] =
          (stats.riddlesByLevel[riddle.levelId] || 0) + 1;
      });

      return stats;
    } catch (error: any) {
      console.error("Get riddle stats error:", error);
      throw new Error(`Failed to get riddle statistics: ${error.message}`);
    }
  }
}
