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
  console.log('ForgotPassword Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { email } = body;

    if (!email) {
      return createResponse(400, {
        success: false,
        message: 'Email is required',
        error: 'Missing required fields',
      });
    }

    const result = await cognitoService.forgotPassword({ email });
    return createResponse(result.success ? 200 : 400, result);
  } catch (error: any) {
    console.error('ForgotPassword Lambda error:', error);
    return createResponse(500, {
      success: false,
      message: 'Forgot password failed',
      error: error.message || 'Internal server error',
    });
  }
};
