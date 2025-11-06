import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RiddleService } from '../../../src/services/riddleService';
import { JWTService } from '../../../src/services/jwtService';

const riddleService = new RiddleService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Get Player Progress Lambda triggered:', JSON.stringify(event, null, 2));

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

    // Get player progress
    const progress = await riddleService.getPlayerProgress(decoded.sub);

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
        data: progress,
        message: 'Player progress retrieved successfully',
      }),
    };
  } catch (error: any) {
    console.error('Get player progress error:', error);
    
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
        message: 'Failed to get player progress',
        error: error.message,
      }),
    };
  }
};
