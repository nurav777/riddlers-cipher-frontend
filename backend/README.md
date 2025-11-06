# Gotham Cipher Backend

Backend API for the Gotham Cipher application with AWS Cognito authentication.

## Features

- 🔐 AWS Cognito integration for user authentication
- 🛡️ JWT token-based authorization
- 🔒 Secure password handling
- 📝 User registration and verification
- 🔄 Password reset functionality

## Prerequisites

- Node.js (v18 or higher)
- AWS Account with Cognito User Pool
- AWS CLI configured (optional)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your AWS Cognito configuration:
   - `AWS_REGION`: Your AWS region
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `COGNITO_USER_POOL_ID`: Your Cognito User Pool ID
   - `COGNITO_CLIENT_ID`: Your Cognito App Client ID
   - `COGNITO_CLIENT_SECRET`: Your Cognito App Client Secret
   - `JWT_SECRET`: Your JWT secret key

3. **Set up AWS Cognito User Pool:**
   - Create a User Pool in AWS Cognito
   - Create an App Client with SRP authentication
   - Enable email verification
   - Configure password policies

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify` - Email verification
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout


### Health Check
- `GET /health` - Server health status

## Authentication Flow

1. User registers with email/password
2. System creates user in Cognito
3. User receives verification email
4. User verifies email with code
5. User can login and receive JWT tokens
6. JWT tokens are used for API authentication

## Security Features

- Password strength validation
- JWT token expiration
- CORS protection
- Helmet security headers
- Input validation
- Error handling

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AWS_REGION` | AWS region | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID | Yes |
| `COGNITO_CLIENT_ID` | Cognito App Client ID | Yes |
| `COGNITO_CLIENT_SECRET` | Cognito App Client Secret | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment | No (default: development) |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:8080) |

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

## Development

- TypeScript for type safety
- Express.js for web framework
- AWS SDK v3 for Cognito integration
- JWT for token management
- Morgan for request logging
- Helmet for security headers
