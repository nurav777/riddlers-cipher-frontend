import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { JWTService } from '../../src/services/jwtService';

/**
 * Lambda response helper
 */
export const createResponse = (
  statusCode: number,
  body: any
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  };
};

/**
 * Extract user from JWT token
 */
export const extractUserFromToken = (event: APIGatewayProxyEvent) => {
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
};

/**
 * Validate authentication
 */
export const validateAuth = (event: APIGatewayProxyEvent) => {
  const user = extractUserFromToken(event);
  if (!user) {
    return {
      isValid: false,
      response: createResponse(401, {
        success: false,
        message: 'Unauthorized',
        error: 'Invalid or missing authentication token',
      }),
    };
  }
  return { isValid: true, user };
};

/**
 * Parse JSON body safely
 */
export const parseBody = (body: string | null) => {
  try {
    return body ? JSON.parse(body) : {};
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
};

/**
 * Get query parameter
 */
export const getQueryParam = (event: APIGatewayProxyEvent, key: string) => {
  return event.queryStringParameters?.[key] || event.multiValueQueryStringParameters?.[key]?.[0];
};

/**
 * Get path parameter
 */
export const getPathParam = (event: APIGatewayProxyEvent, key: string) => {
  return event.pathParameters?.[key];
};
