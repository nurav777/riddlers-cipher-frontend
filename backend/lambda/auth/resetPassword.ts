import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoService } from '../../src/services/cognitoService';

const cognitoService = new CognitoService();

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
  console.log('ResetPassword Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return createResponse(400, {
        success: false,
        message: 'Email, code, and new password are required',
        error: 'Missing required fields',
      });
    }

    if (newPassword.length < 8) {
      return createResponse(400, {
        success: false,
        message: 'Password must be at least 8 characters long',
        error: 'Weak password',
      });
    }

    const result = await cognitoService.resetPassword({
      email,
      code,
      newPassword,
    });

    return createResponse(result.success ? 200 : 400, result);
  } catch (error: any) {
    console.error('ResetPassword Lambda error:', error);
    return createResponse(500, {
      success: false,
      message: 'Password reset failed',
      error: error.message || 'Internal server error',
    });
  }
};
