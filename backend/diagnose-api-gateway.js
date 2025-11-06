#!/usr/bin/env node

/**
 * AWS API Gateway Diagnostic Tool
 * Diagnoses 404 errors in HTTP API Gateway deployments
 * Usage: node diagnose-api-gateway.js <api-id> [region]
 */

const AWS = require('aws-sdk');

const apiId = process.argv[2];
const region = process.argv[3] || 'ap-southeast-2';

if (!apiId) {
  console.error('Usage: node diagnose-api-gateway.js <api-id> [region]');
  console.error('Example: node diagnose-api-gateway.js pit5nsq8w0 ap-southeast-2');
  process.exit(1);
}

const apiGateway = new AWS.ApiGatewayV2({ region });
const lambda = new AWS.Lambda({ region });

async function diagnose() {
  console.log(`\n🔍 Diagnosing API Gateway: ${apiId} (Region: ${region})\n`);

  try {
    // 1. Get API details
    console.log('📋 Step 1: Fetching API details...');
    const apiDetails = await apiGateway.getApi({ ApiId: apiId }).promise();
    console.log(`✅ API Name: ${apiDetails.Name}`);
    console.log(`✅ Protocol Type: ${apiDetails.ProtocolType}`);
    console.log(`✅ API Endpoint: ${apiDetails.ApiEndpoint}\n`);

    // 2. List all routes
    console.log('🛣️  Step 2: Listing all routes...');
    const routesResponse = await apiGateway.getRoutes({ ApiId: apiId }).promise();
    const routes = routesResponse.Items || [];
    
    if (routes.length === 0) {
      console.warn('⚠️  WARNING: No routes found! This is likely the cause of 404 errors.');
      console.warn('   Action: Create routes using create-route command.\n');
    } else {
      console.log(`✅ Found ${routes.length} route(s):\n`);
      routes.forEach((route, idx) => {
        console.log(`   Route ${idx + 1}:`);
        console.log(`   - Route Key: ${route.RouteKey}`);
        console.log(`   - Route ID: ${route.RouteId}`);
        console.log(`   - Target: ${route.Target || 'NOT SET'}`);
        console.log(`   - Authorization Type: ${route.AuthorizationType || 'NONE'}`);
        console.log('');
      });
    }

    // 3. List all integrations
    console.log('🔗 Step 3: Listing all integrations...');
    const integrationsResponse = await apiGateway.getIntegrations({ ApiId: apiId }).promise();
    const integrations = integrationsResponse.Items || [];
    
    if (integrations.length === 0) {
      console.warn('⚠️  WARNING: No integrations found!');
      console.warn('   Action: Create integrations for each Lambda function.\n');
    } else {
      console.log(`✅ Found ${integrations.length} integration(s):\n`);
      integrations.forEach((integration, idx) => {
        console.log(`   Integration ${idx + 1}:`);
        console.log(`   - Integration ID: ${integration.IntegrationId}`);
        console.log(`   - Type: ${integration.IntegrationType}`);
        console.log(`   - URI: ${integration.IntegrationUri || 'NOT SET'}`);
        console.log(`   - Payload Format: ${integration.PayloadFormatVersion || 'NOT SET'}`);
        console.log('');
      });
    }

    // 4. List all stages
    console.log('🎭 Step 4: Listing all stages...');
    const stagesResponse = await apiGateway.getStages({ ApiId: apiId }).promise();
    const stages = stagesResponse.Items || [];
    
    if (stages.length === 0) {
      console.warn('⚠️  WARNING: No stages found!');
      console.warn('   Action: Create a stage using create-stage command.\n');
    } else {
      console.log(`✅ Found ${stages.length} stage(s):\n`);
      stages.forEach((stage, idx) => {
        console.log(`   Stage ${idx + 1}:`);
        console.log(`   - Stage Name: ${stage.StageName}`);
        console.log(`   - Stage ID: ${stage.StageId}`);
        console.log(`   - Auto Deploy: ${stage.AutoDeploy ? 'YES' : 'NO'}`);
        console.log(`   - Deployment ID: ${stage.DeploymentId || 'NOT SET'}`);
        console.log(`   - Invoke URL: https://${apiId}.execute-api.${region}.amazonaws.com/${stage.StageName}`);
        console.log('');
      });
    }

    // 5. List deployments
    console.log('📦 Step 5: Listing deployments...');
    const deploymentsResponse = await apiGateway.getDeployments({ ApiId: apiId }).promise();
    const deployments = deploymentsResponse.Items || [];
    
    if (deployments.length === 0) {
      console.warn('⚠️  WARNING: No deployments found!');
      console.warn('   Action: Create a deployment using create-deployment command.\n');
    } else {
      console.log(`✅ Found ${deployments.length} deployment(s):\n`);
      deployments.forEach((deployment, idx) => {
        console.log(`   Deployment ${idx + 1}:`);
        console.log(`   - Deployment ID: ${deployment.DeploymentId}`);
        console.log(`   - Created Date: ${deployment.CreationDate}`);
        console.log('');
      });
    }

    // 6. Verify Lambda functions exist
    console.log('⚡ Step 6: Verifying Lambda functions...');
    const lambdaFunctions = [
      'GetRandomRiddleFunction',
      'ValidateAnswerFunction',
      'SolveRiddleFunction',
      'GetPlayerProgressFunction'
    ];

    for (const funcName of lambdaFunctions) {
      try {
        const funcDetails = await lambda.getFunction({ FunctionName: funcName }).promise();
        console.log(`✅ ${funcName} exists (ARN: ${funcDetails.Configuration.FunctionArn})`);
      } catch (err) {
        console.warn(`⚠️  ${funcName} NOT FOUND`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(80) + '\n');

    const issues = [];
    if (routes.length === 0) issues.push('❌ No routes defined');
    if (integrations.length === 0) issues.push('❌ No integrations defined');
    if (stages.length === 0) issues.push('❌ No stages defined');
    if (deployments.length === 0) issues.push('❌ No deployments created');
    if (routes.length !== integrations.length) issues.push('⚠️  Route count does not match integration count');

    if (issues.length === 0) {
      console.log('✅ All basic checks passed!\n');
      console.log('Possible remaining issues:');
      console.log('1. Lambda function permissions - Routes may not have permission to invoke Lambda');
      console.log('2. Incorrect integration URI - Lambda ARN may be wrong');
      console.log('3. Payload format mismatch - Check PayloadFormatVersion (1.0 vs 2.0)');
      console.log('4. Route not attached to stage - Check if routes are linked to the stage deployment\n');
    } else {
      console.log('Issues found:\n');
      issues.forEach(issue => console.log(`  ${issue}`));
      console.log('\n');
    }

    console.log('🔧 RECOMMENDED ACTIONS:\n');
    console.log('1. Verify routes are created:');
    console.log(`   aws apigatewayv2 get-routes --api-id ${apiId} --region ${region}\n`);
    
    console.log('2. Verify integrations are created:');
    console.log(`   aws apigatewayv2 get-integrations --api-id ${apiId} --region ${region}\n`);
    
    console.log('3. Verify stage exists:');
    console.log(`   aws apigatewayv2 get-stages --api-id ${apiId} --region ${region}\n`);
    
    console.log('4. Test the API endpoint:');
    if (stages.length > 0) {
      const prodStage = stages.find(s => s.StageName === 'prod');
      if (prodStage) {
        console.log(`   curl https://${apiId}.execute-api.${region}.amazonaws.com/prod/riddles/random\n`);
      }
    }

    console.log('5. If routes/integrations are missing, redeploy using:');
    console.log('   bash deploy-riddles-lambda.sh\n');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
    process.exit(1);
  }
}

diagnose();
