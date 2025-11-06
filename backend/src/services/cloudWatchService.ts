import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";

// AWS Configuration
const clientConfig: ConstructorParameters<typeof CloudWatchLogsClient>[0] = {
  region: process.env.AWS_REGION || "us-east-1",
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const cloudWatchLogsClient = new CloudWatchLogsClient(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);

const LOG_GROUP_NAME =
  process.env.CLOUDWATCH_LOG_GROUP || "GothamCipherRiddles";
const LOG_STREAM_NAME = process.env.CLOUDWATCH_LOG_STREAM || "RiddleService";
const NAMESPACE = process.env.CLOUDWATCH_NAMESPACE || "GothamCipher/Riddles";

export interface LogEvent {
  timestamp: number;
  message: string;
  level: "INFO" | "WARN" | "ERROR";
  metadata?: Record<string, any>;
}

export interface MetricData {
  metricName: string;
  value: number;
  unit?: "Count" | "Milliseconds" | "Percent";
  dimensions?: Record<string, string>;
}

export class CloudWatchService {
  private logGroupCreated = false;
  private logStreamCreated = false;
  private sequenceToken?: string;

  /**
   * Initialize CloudWatch logging
   */
  async initialize(): Promise<void> {
    try {
      console.log("CloudWatch: initializing logging subsystem...");
      await this.createLogGroup();
      await this.createLogStream();
      console.log("CloudWatch: initialization complete");
    } catch (error) {
      console.error("Failed to initialize CloudWatch logging:", error);
    }
  }

  /**
   * Create CloudWatch log group
   */
  private async createLogGroup(): Promise<void> {
    if (this.logGroupCreated) return;

    try {
      await cloudWatchLogsClient.send(
        new CreateLogGroupCommand({
          logGroupName: LOG_GROUP_NAME,
        })
      );
      console.log(`CloudWatch log group ${LOG_GROUP_NAME} created`);
      this.logGroupCreated = true;
    } catch (error: any) {
      if (error.name === "ResourceAlreadyExistsException") {
        console.log(`CloudWatch log group ${LOG_GROUP_NAME} already exists`);
        this.logGroupCreated = true;
      } else {
        throw error;
      }
    }
  }

  /**
   * Create CloudWatch log stream
   */
  private async createLogStream(): Promise<void> {
    if (this.logStreamCreated) return;

    try {
      await cloudWatchLogsClient.send(
        new CreateLogStreamCommand({
          logGroupName: LOG_GROUP_NAME,
          logStreamName: LOG_STREAM_NAME,
        })
      );
      console.log(`CloudWatch log stream ${LOG_STREAM_NAME} created`);
      this.logStreamCreated = true;
    } catch (error: any) {
      if (error.name === "ResourceAlreadyExistsException") {
        console.log(`CloudWatch log stream ${LOG_STREAM_NAME} already exists`);
        this.logStreamCreated = true;
      } else {
        throw error;
      }
    }
  }

  /**
   * Log an event to CloudWatch
   */
  async logEvent(event: LogEvent): Promise<void> {
    try {
      if (!this.logGroupCreated || !this.logStreamCreated) {
        await this.initialize();
      }

      const logMessage = JSON.stringify({
        timestamp: new Date(event.timestamp).toISOString(),
        level: event.level,
        message: event.message,
        metadata: event.metadata,
      });

      const command = new PutLogEventsCommand({
        logGroupName: LOG_GROUP_NAME,
        logStreamName: LOG_STREAM_NAME,
        logEvents: [
          {
            timestamp: event.timestamp,
            message: logMessage,
          },
        ],
        sequenceToken: this.sequenceToken,
      });

      const response = await cloudWatchLogsClient.send(command);
      this.sequenceToken = response.nextSequenceToken;

      // Also log to console for development
      console.log(`[${event.level}] ${event.message}`, event.metadata);
    } catch (error) {
      console.error("Failed to log to CloudWatch:", error);
    }
  }

  /**
   * Log riddle request
   */
  async logRiddleRequest(
    playerId: string,
    levelId?: number,
    difficulty?: string,
    type?: string
  ): Promise<void> {
    await this.logEvent({
      timestamp: Date.now(),
      level: "INFO",
      message: "Riddle request received",
      metadata: {
        playerId,
        levelId,
        difficulty,
        type,
        action: "riddle_request",
      },
    });
  }

  /**
   * Log riddle completion
   */
  async logRiddleCompletion(
    playerId: string,
    riddleId: string,
    levelId: number,
    stars: number,
    completionTime: number
  ): Promise<void> {
    await this.logEvent({
      timestamp: Date.now(),
      level: "INFO",
      message: "Riddle completed successfully",
      metadata: {
        playerId,
        riddleId,
        levelId,
        stars,
        completionTime,
        action: "riddle_completion",
      },
    });
  }

  /**
   * Log riddle validation
   */
  async logRiddleValidation(
    playerId: string,
    riddleId: string,
    isValid: boolean,
    attemptTime: number
  ): Promise<void> {
    await this.logEvent({
      timestamp: Date.now(),
      level: "INFO",
      message: "Riddle answer validated",
      metadata: {
        playerId,
        riddleId,
        isValid,
        attemptTime,
        action: "riddle_validation",
      },
    });
  }

  /**
   * Log error
   */
  async logError(
    error: Error,
    context: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      timestamp: Date.now(),
      level: "ERROR",
      message: error.message,
      metadata: {
        error: error.name,
        stack: error.stack,
        context,
        action: "error",
      },
    });
  }

  /**
   * Send custom metric to CloudWatch
   */
  async sendMetric(metricData: MetricData): Promise<void> {
    try {
      const command = new PutMetricDataCommand({
        Namespace: NAMESPACE,
        MetricData: [
          {
            MetricName: metricData.metricName,
            Value: metricData.value,
            Unit: metricData.unit || "Count",
            Dimensions: metricData.dimensions
              ? Object.entries(metricData.dimensions).map(([Name, Value]) => ({
                  Name,
                  Value,
                }))
              : undefined,
            Timestamp: new Date(),
          },
        ],
      });

      await cloudWatchClient.send(command);
    } catch (error) {
      console.error("Failed to send metric to CloudWatch:", error);
    }
  }

  /**
   * Send riddle request metric
   */
  async sendRiddleRequestMetric(
    levelId: number,
    difficulty: string
  ): Promise<void> {
    await this.sendMetric({
      metricName: "RiddleRequests",
      value: 1,
      unit: "Count",
      dimensions: {
        LevelId: levelId.toString(),
        Difficulty: difficulty,
      },
    });
  }

  /**
   * Send riddle completion metric
   */
  async sendRiddleCompletionMetric(
    levelId: number,
    stars: number,
    completionTime: number
  ): Promise<void> {
    await this.sendMetric({
      metricName: "RiddleCompletions",
      value: 1,
      unit: "Count",
      dimensions: {
        LevelId: levelId.toString(),
        Stars: stars.toString(),
      },
    });

    await this.sendMetric({
      metricName: "RiddleCompletionTime",
      value: completionTime,
      unit: "Milliseconds",
      dimensions: {
        LevelId: levelId.toString(),
      },
    });
  }

  /**
   * Send error metric
   */
  async sendErrorMetric(errorType: string, levelId?: number): Promise<void> {
    await this.sendMetric({
      metricName: "Errors",
      value: 1,
      unit: "Count",
      dimensions: {
        ErrorType: errorType,
        ...(levelId && { LevelId: levelId.toString() }),
      },
    });
  }

  /**
   * Send performance metric
   */
  async sendPerformanceMetric(
    operation: string,
    duration: number,
    levelId?: number
  ): Promise<void> {
    await this.sendMetric({
      metricName: "Performance",
      value: duration,
      unit: "Milliseconds",
      dimensions: {
        Operation: operation,
        ...(levelId && { LevelId: levelId.toString() }),
      },
    });
  }
}

// Export singleton instance
export const cloudWatchService = new CloudWatchService();
