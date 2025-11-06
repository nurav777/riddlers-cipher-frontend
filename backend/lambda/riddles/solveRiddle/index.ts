import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RiddleService } from '../../../src/services/riddleService';
import { JWTService } from '../../../src/services/jwtService';

const riddleService = new RiddleService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Solve Riddle Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    // Extract and validate JWT token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access token required',
          error: 'No token provided',
        }),
      };
    }

    // Verify token
    if (JWTService.isTokenExpired(token)) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Token expired',
          error: 'Please login again',
        }),
      };
    }

    const decoded = JWTService.verifyToken(token);
    if (!decoded) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid token',
          error: 'Token verification failed',
        }),
      };
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { riddleId, levelId, stars, completionTime } = body;

    if (!riddleId || !levelId || stars === undefined) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Riddle ID, level ID, and stars are required',
        }),
      };
    }

    // Update player progress
    const updatedProgress = await riddleService.updatePlayerProgress(
      decoded.sub,
      riddleId,
      levelId,
      stars,
      completionTime
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: updatedProgress,
        message: 'Riddle solved and progress updated',
      }),
    };
  } catch (error: any) {
    console.error('Solve riddle error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to solve riddle',
        error: error.message,
      }),
    };
  }
};
