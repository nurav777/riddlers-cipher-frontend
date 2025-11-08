import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RiddleService } from '../../src/services/riddleService';
import { JWTService } from '../../src/services/jwtService';

const riddleService = new RiddleService();

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

function extractUserFromToken(event: APIGatewayProxyEvent) {
  try {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = JWTService.verifyToken(token);
    return decoded;
  } catch (error) {
    console.error('Token extraction error:', error);
    return null;
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('ValidateAnswer Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const user = extractUserFromToken(event);
    if (!user) {
      return createResponse(401, {
        success: false,
        message: 'Unauthorized',
        error: 'Invalid or missing authentication token',
      });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { riddleId, answer } = body;

    if (!riddleId || !answer) {
      return createResponse(400, {
        success: false,
        message: 'Riddle ID and answer are required',
      });
    }

    const isValid = await riddleService.validateAnswer(riddleId, answer);

    return createResponse(200, {
      success: true,
      data: { isValid },
      message: 'Validation completed',
    });
  } catch (error: any) {
    console.error('ValidateAnswer Lambda error:', error);
    return createResponse(500, {
      success: false,
      message: 'Failed to validate answer',
      error: error.message || 'Internal server error',
    });
  }
};
