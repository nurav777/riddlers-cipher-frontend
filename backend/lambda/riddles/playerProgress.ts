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
  console.log('PlayerProgress Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const user = extractUserFromToken(event);
    if (!user) {
      return createResponse(401, {
        success: false,
        message: 'Unauthorized',
        error: 'Invalid or missing authentication token',
      });
    }

    const playerId = user.sub;
    const progress = await riddleService.getPlayerProgress(playerId);

    return createResponse(200, {
      success: true,
      data: progress,
      message: 'Player progress retrieved successfully',
    });
  } catch (error: any) {
    console.error('PlayerProgress Lambda error:', error);
    return createResponse(500, {
      success: false,
      message: 'Failed to get player progress',
      error: error.message || 'Internal server error',
    });
  }
};
