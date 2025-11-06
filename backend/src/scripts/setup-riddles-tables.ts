import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";

dotenv.config();

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

const RIDDLES_TABLE = process.env.RIDDLES_TABLE_NAME || "GothamRiddles";
const PROGRESS_TABLE = process.env.PROGRESS_TABLE_NAME || "PlayerProgress";

async function createRiddlesTable() {
  console.log(`🦇 Creating ${RIDDLES_TABLE} table...`);
  
  try {
    const command = new CreateTableCommand({
      TableName: RIDDLES_TABLE,
      AttributeDefinitions: [
        {
          AttributeName: "riddleId",
          AttributeType: "S"
        },
        {
          AttributeName: "levelId",
          AttributeType: "N"
        },
        {
          AttributeName: "difficulty",
          AttributeType: "S"
        },
        {
          AttributeName: "type",
          AttributeType: "S"
        }
      ],
      KeySchema: [
        {
          AttributeName: "riddleId",
          KeyType: "HASH"
        }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "LevelIndex",
          KeySchema: [
            {
              AttributeName: "levelId",
              KeyType: "HASH"
            }
          ],
          Projection: {
            ProjectionType: "ALL"
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        {
          IndexName: "DifficultyIndex",
          KeySchema: [
            {
              AttributeName: "difficulty",
              KeyType: "HASH"
            }
          ],
          Projection: {
            ProjectionType: "ALL"
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        {
          IndexName: "TypeIndex",
          KeySchema: [
            {
              AttributeName: "type",
              KeyType: "HASH"
            }
          ],
          Projection: {
            ProjectionType: "ALL"
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    });

    await dynamoClient.send(command);
    console.log(`✅ ${RIDDLES_TABLE} table created successfully`);
  } catch (error: any) {
    if (error.name === "ResourceInUseException") {
      console.log(`ℹ️  ${RIDDLES_TABLE} table already exists`);
    } else {
      console.error(`❌ Failed to create ${RIDDLES_TABLE} table:`, error);
      throw error;
    }
  }
}

async function createPlayerProgressTable() {
  console.log(`🦇 Creating ${PROGRESS_TABLE} table...`);
  
  try {
    const command = new CreateTableCommand({
      TableName: PROGRESS_TABLE,
      AttributeDefinitions: [
        {
          AttributeName: "playerId",
          AttributeType: "S"
        },
        {
          AttributeName: "lastPlayedTimestamp",
          AttributeType: "S"
        }
      ],
      KeySchema: [
        {
          AttributeName: "playerId",
          KeyType: "HASH"
        }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "LastPlayedIndex",
          KeySchema: [
            {
              AttributeName: "lastPlayedTimestamp",
              KeyType: "HASH"
            }
          ],
          Projection: {
            ProjectionType: "ALL"
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    });

    await dynamoClient.send(command);
    console.log(`✅ ${PROGRESS_TABLE} table created successfully`);
  } catch (error: any) {
    if (error.name === "ResourceInUseException") {
      console.log(`ℹ️  ${PROGRESS_TABLE} table already exists`);
    } else {
      console.error(`❌ Failed to create ${PROGRESS_TABLE} table:`, error);
      throw error;
    }
  }
}

async function setupTables() {
  console.log("🦇 Setting up Gotham Cipher Riddles Tables...");
  console.log("==========================================");
  
  try {
    await createRiddlesTable();
    await createPlayerProgressTable();
    
    console.log("\n🎉 All tables created successfully!");
    console.log("\nNext steps:");
    console.log("1. Run the migration script: npm run migrate-riddles");
    console.log("2. Update your environment variables");
    console.log("3. Test the API endpoints");
    
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupTables();
}

export { setupTables, createRiddlesTable, createPlayerProgressTable };
