import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoService } from '../../src/services/cognitoService';
import { DynamoService } from '../../src/services/dynamoService';
import { JWTService } from '../../src/services/jwtService';

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

function extractSubFromIdToken(idToken: string): string {
  try {
    const base64Url = idToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.sub || payload.aud || '';
  } catch (error) {
    console.error('Error extracting sub from ID token:', error);
    return '';
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Login Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { email, password } = body;

    if (!email || !password) {
      return createResponse(400, {
        success: false,
        message: 'Email and password are required',
        error: 'Missing required fields',
      });
    }

    // Authenticate with Cognito
    const result = await cognitoService.login({ email, password });

    if (result.success && result.data?.tokens) {
      const cognitoSub = extractSubFromIdToken(result.data.tokens.idToken);

      // Get user profile from DynamoDB
      let profile = await dynamoService.getUserProfile(cognitoSub);

      if (!profile) {
        const emailProfile = await dynamoService.getUserProfileByEmail(email);
        if (emailProfile) {
          await dynamoService.migrateProfileToCognitoSub(emailProfile.userId, cognitoSub);
          profile = await dynamoService.getUserProfile(cognitoSub);
        } else {
          const user = await cognitoService.getUserByEmail(email);
          if (user) {
            profile = await dynamoService.createUserProfile(
              cognitoSub,
              email,
              user.username || email.split('@')[0],
              user.firstName || '',
              user.lastName || ''
            );
          }
        }
      }

      if (profile) {
        await dynamoService.updateLastLogin(profile.userId);
      }

      const jwtToken = JWTService.generateToken({
        sub: cognitoSub,
        email: result.data.user?.email || '',
        username: result.data.user?.username || '',
      });

      return createResponse(200, {
        ...result,
        data: {
          ...result.data,
          jwtToken,
          profile,
        },
      });
    } else {
      return createResponse(401, result);
    }
  } catch (error: any) {
    console.error('Login Lambda error:', error);
    return createResponse(500, {
      success: false,
      message: 'Login failed',
      error: error.message || 'Internal server error',
    });
  }
};
