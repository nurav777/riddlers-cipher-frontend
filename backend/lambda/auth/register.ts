import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoService } from '../../src/services/cognitoService';
import { DynamoService } from '../../src/services/dynamoService';

const cognitoService = new CognitoService();
const dynamoService = new DynamoService();

const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
  body: JSON.stringify(body),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Register Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { email, password, firstName, lastName, username } = body;

    if (!email || !password || !firstName || !lastName || !username) {
      return createResponse(400, {
        success: false,
        message: 'All fields are required',
        error: 'Missing required fields',
      });
    }

    if (password.length < 8) {
      return createResponse(400, {
        success: false,
        message: 'Password must be at least 8 characters long',
        error: 'Weak password',
      });
    }

    const isUsernameAvailable = await dynamoService.isUsernameAvailable(username);
    if (!isUsernameAvailable) {
      return createResponse(400, {
        success: false,
        message: 'Username is already taken',
        error: 'Username not available',
      });
    }

    const result = await cognitoService.register({
      email,
      password,
      firstName,
      lastName,
      username,
    });

    if (result.success) {
      try {
        await dynamoService.createUserProfile(
          email,
          email,
          username,
          firstName,
          lastName
        );
      } catch (profileError) {
        console.error('Failed to create user profile:', profileError);
      }
    }

    return createResponse(result.success ? 201 : 400, result);
  } catch (error: any) {
    console.error('Register Lambda error:', error);
    return createResponse(500, {
      success: false,
      message: 'Registration failed',
      error: error.message || 'Internal server error',
    });
  }
};
