import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand as DocQueryCommand,
  ScanCommand as DocScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { UserProfile, ProfileUpdateRequest } from "../types";

// Build client config, only attach explicit credentials if both are provided
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

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "UserProfiles";

export class DynamoService {
  private ensureTableConfig(): void {
    if (!TABLE_NAME) {
      throw new Error("DYNAMODB_TABLE_NAME is not configured");
    }
  }

  /**
   * Create user profile in DynamoDB
   */
  async createUserProfile(userId: string, email: string, username: string, firstName: string, lastName: string): Promise<UserProfile> {
    try {
      this.ensureTableConfig();

      const now = new Date().toISOString();
      const profile: UserProfile = {
        userId,
        profileType: "main",
        email,
        username,
        firstName,
        lastName,
        preferences: {
          theme: "dark",
          language: "en",
          notifications: true,
          soundEnabled: true,
        },
        gameStats: {
          totalScore: 0,
          levelsCompleted: 0,
          achievements: [],
          playTime: 0,
        },
        createdAt: now,
        updatedAt: now,
        isActive: true,
      };

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: profile,
      }));

      return profile;
    } catch (error: any) {
      console.error("Create user profile error:", error);
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
  }

  /**
   * Get user profile by userId
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      this.ensureTableConfig();

      const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          profileType: "main",
        },
      }));

      return result.Item as UserProfile || null;
    } catch (error: any) {
      console.error("Get user profile error:", error);
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  /**
   * Get user profile by email
   */
  async getUserProfileByEmail(email: string): Promise<UserProfile | null> {
    try {
      this.ensureTableConfig();

      const result = await docClient.send(new DocQueryCommand({
        TableName: TABLE_NAME,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      }));

      return result.Items?.[0] as UserProfile || null;
    } catch (error: any) {
      console.error("Get user profile by email error:", error);
      throw new Error(`Failed to get user profile by email: ${error.message}`);
    }
  }

  /**
   * Get user profile by username
   */
  async getUserProfileByUsername(username: string): Promise<UserProfile | null> {
    try {
      this.ensureTableConfig();

      const result = await docClient.send(new DocQueryCommand({
        TableName: TABLE_NAME,
        IndexName: "username-index",
        KeyConditionExpression: "username = :username",
        ExpressionAttributeValues: {
          ":username": username,
        },
      }));

      return result.Items?.[0] as UserProfile || null;
    } catch (error: any) {
      console.error("Get user profile by username error:", error);
      throw new Error(`Failed to get user profile by username: ${error.message}`);
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: ProfileUpdateRequest): Promise<UserProfile> {
    try {
      this.ensureTableConfig();

      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      // Build update expression dynamically
      if (updates.firstName !== undefined) {
        updateExpressions.push("#firstName = :firstName");
        expressionAttributeNames["#firstName"] = "firstName";
        expressionAttributeValues[":firstName"] = updates.firstName;
      }

      if (updates.lastName !== undefined) {
        updateExpressions.push("#lastName = :lastName");
        expressionAttributeNames["#lastName"] = "lastName";
        expressionAttributeValues[":lastName"] = updates.lastName;
      }

      if (updates.username !== undefined) {
        updateExpressions.push("#username = :username");
        expressionAttributeNames["#username"] = "username";
        expressionAttributeValues[":username"] = updates.username;
      }

      if (updates.avatar !== undefined) {
        updateExpressions.push("#avatar = :avatar");
        expressionAttributeNames["#avatar"] = "avatar";
        expressionAttributeValues[":avatar"] = updates.avatar;
      }

      if (updates.bio !== undefined) {
        updateExpressions.push("#bio = :bio");
        expressionAttributeNames["#bio"] = "bio";
        expressionAttributeValues[":bio"] = updates.bio;
      }

      if (updates.preferences !== undefined) {
        updateExpressions.push("#preferences = :preferences");
        expressionAttributeNames["#preferences"] = "preferences";
        expressionAttributeValues[":preferences"] = updates.preferences;
      }

      // Always update the updatedAt timestamp
      updateExpressions.push("#updatedAt = :updatedAt");
      expressionAttributeNames["#updatedAt"] = "updatedAt";
      expressionAttributeValues[":updatedAt"] = new Date().toISOString();

      if (updateExpressions.length === 0) {
        throw new Error("No valid fields to update");
      }

      const result = await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          profileType: "main",
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }));

      return result.Attributes as UserProfile;
    } catch (error: any) {
      console.error("Update user profile error:", error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  /**
   * Update user's last login time
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      this.ensureTableConfig();

      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          profileType: "main",
        },
        UpdateExpression: "SET #lastLogin = :lastLogin, #updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#lastLogin": "lastLogin",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":lastLogin": new Date().toISOString(),
          ":updatedAt": new Date().toISOString(),
        },
      }));
    } catch (error: any) {
      console.error("Update last login error:", error);
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  /**
   * Update user's game statistics
   */
  async updateGameStats(userId: string, gameStats: Partial<UserProfile['gameStats']>): Promise<UserProfile> {
    try {
      this.ensureTableConfig();

      const result = await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          profileType: "main",
        },
        UpdateExpression: "SET #gameStats = :gameStats, #updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#gameStats": "gameStats",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":gameStats": gameStats,
          ":updatedAt": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      }));

      return result.Attributes as UserProfile;
    } catch (error: any) {
      console.error("Update game stats error:", error);
      throw new Error(`Failed to update game stats: ${error.message}`);
    }
  }

  /**
   * Delete user profile
   */
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      this.ensureTableConfig();

      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          profileType: "main",
        },
      }));
    } catch (error: any) {
      console.error("Delete user profile error:", error);
      throw new Error(`Failed to delete user profile: ${error.message}`);
    }
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const existingProfile = await this.getUserProfileByUsername(username);
      return existingProfile === null;
    } catch (error: any) {
      console.error("Check username availability error:", error);
      return false;
    }
  }

  /**
   * Create DynamoDB table (for development/setup)
   */
  async createTable(): Promise<void> {
    try {
      this.ensureTableConfig();

      const command = new CreateTableCommand({
        TableName: TABLE_NAME,
        KeySchema: [
          { AttributeName: "userId", KeyType: "HASH" },
          { AttributeName: "profileType", KeyType: "RANGE" },
        ],
        AttributeDefinitions: [
          { AttributeName: "userId", AttributeType: "S" },
          { AttributeName: "profileType", AttributeType: "S" },
          { AttributeName: "email", AttributeType: "S" },
          { AttributeName: "username", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "EmailIndex",
            KeySchema: [
              { AttributeName: "email", KeyType: "HASH" },
            ],
            Projection: { ProjectionType: "ALL" },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          },
          {
            IndexName: "UsernameIndex",
            KeySchema: [
              { AttributeName: "username", KeyType: "HASH" },
            ],
            Projection: { ProjectionType: "ALL" },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      });

      await dynamoClient.send(command);
      console.log(`Table ${TABLE_NAME} created successfully`);
    } catch (error: any) {
      if (error.name === "ResourceInUseException") {
        console.log(`Table ${TABLE_NAME} already exists`);
      } else {
        console.error("Create table error:", error);
        throw new Error(`Failed to create table: ${error.message}`);
      }
    }
  }

  /**
   * Migrate profile from email-based userId to Cognito sub
   */
  async migrateProfileToCognitoSub(oldUserId: string, newUserId: string): Promise<void> {
    try {
      this.ensureTableConfig();

      // Get the existing profile
      const existingProfile = await this.getUserProfile(oldUserId);
      if (!existingProfile) {
        throw new Error("Profile not found for migration");
      }

      // Create new profile with Cognito sub
      const migratedProfile: UserProfile = {
        ...existingProfile,
        userId: newUserId,
        updatedAt: new Date().toISOString(),
      };

      // Save the new profile
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: migratedProfile,
      }));

      // Delete the old profile
      await docClient.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          userId: oldUserId,
          profileType: "main",
        },
      }));

      console.log(`Profile migrated from ${oldUserId} to ${newUserId}`);
    } catch (error: any) {
      console.error("Migrate profile error:", error);
      throw new Error(`Failed to migrate profile: ${error.message}`);
    }
  }

  /**
   * Check if table exists
   */
  async tableExists(): Promise<boolean> {
    try {
      await dynamoClient.send(new DescribeTableCommand({
        TableName: TABLE_NAME,
      }));
      return true;
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Update user's level progress
   */
  async updateLevelProgress(userId: string, levelProgress: any): Promise<UserProfile> {
    try {
      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          profileType: "main",
        },
        UpdateExpression: "SET levelProgress = :levelProgress, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":levelProgress": levelProgress,
          ":updatedAt": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      });

      const result = await docClient.send(command);
      return result.Attributes as UserProfile;
    } catch (error) {
      console.error("Error updating level progress:", error);
      throw error;
    }
  }
}
