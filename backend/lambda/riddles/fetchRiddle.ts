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
  console.log('FetchRiddle Lambda invoked:', JSON.stringify(event, null, 2));

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
    const levelId = event.queryStringParameters?.levelId
      ? parseInt(event.queryStringParameters.levelId)
      : undefined;
    const difficulty = event.queryStringParameters?.difficulty as 'easy' | 'medium' | 'hard' | undefined;
    const type = event.queryStringParameters?.type;
    const excludeSolved = event.queryStringParameters?.excludeSolved !== 'false';

    const request = {
      playerId,
      levelId,
      difficulty,
      type,
      excludeSolved,
    };

    const result = await riddleService.getRandomRiddle(request);

    return createResponse(200, {
      success: true,
      data: result,
      message: 'Random riddle retrieved successfully',
    });
  } catch (error: any) {
    console.error('FetchRiddle Lambda error:', error);
    return createResponse(500, {
      success: false,
      message: 'Failed to get random riddle',
      error: error.message || 'Internal server error',
    });
  }
};
