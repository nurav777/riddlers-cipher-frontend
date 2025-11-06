import dotenv from "dotenv";
dotenv.config();
import { DynamoService } from "./services/dynamoService";

async function setupDynamoDB() {
  console.log("🚀 Setting up DynamoDB table...");
  
  const dynamoService = new DynamoService();
  
  try {
    // Check if table exists
    const tableExists = await dynamoService.tableExists();
    
    if (tableExists) {
      console.log("✅ DynamoDB table already exists");
      return;
    }
    
    // Create table
    await dynamoService.createTable();
    console.log("✅ DynamoDB table created successfully");
    
  } catch (error) {
    console.error("❌ Failed to setup DynamoDB table:", error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDynamoDB();
}

export { setupDynamoDB };
