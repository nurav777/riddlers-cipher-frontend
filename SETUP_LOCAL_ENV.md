# Local Environment Setup for Gotham Cipher Frontend

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git

## Step 1: Clone Repository

```bash
git clone https://github.com/your-username/riddlers-cipher-pre-deployment.git
cd riddlers-cipher-pre-deployment
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Create `.env` File

Create a `.env` file in the project root (this file is gitignored for security):

```bash
# Copy from env.example
cp env.example .env
```

Edit `.env` and set the API base URL:

```
VITE_API_BASE_URL=https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
```

### For Local Development

If testing against a local backend:

```
VITE_API_BASE_URL=http://localhost:3001
```

## Step 4: Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Step 5: Test API Integration

### 1. Test Registration

```bash
curl -X POST https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "username": "testuser"
  }'
```

### 2. Test Login

```bash
curl -X POST https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the JWT token from the response.

### 3. Test Get Random Riddle

```bash
curl https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/random \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Test Validate Answer

```bash
curl -X POST https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "riddleId": "riddle-123",
    "answer": "piano"
  }'
```

### 5. Test Solve Riddle

```bash
curl -X POST https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/solve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "riddleId": "riddle-123",
    "levelId": 1,
    "stars": 3,
    "completionTime": 45
  }'
```

### 6. Test Get Player Progress

```bash
curl https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod/riddles/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Step 6: Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Step 7: Preview Production Build

```bash
npm run preview
```

This runs the production build locally for testing.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod` |

## Troubleshooting

### Issue: Module not found errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 5173 already in use

```bash
# Use a different port
npm run dev -- --port 3000
```

### Issue: API calls fail with CORS error

1. Check that `VITE_API_BASE_URL` is set correctly
2. Verify backend API Gateway has CORS enabled
3. Check browser console for detailed error message

### Issue: JWT token not working

1. Verify token is being sent in `Authorization: Bearer <token>` format
2. Check token expiration
3. Ensure backend Lambda functions are deployed

## Next Steps

1. ✅ Set up local environment
2. ✅ Test all API endpoints
3. ✅ Verify authentication flow
4. ✅ Deploy to AWS Amplify (see AMPLIFY_DEPLOYMENT_GUIDE.md)

## Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Install new dependency
npm install package-name

# Update all dependencies
npm update
```

## File Structure

```
riddlers-cipher-pre-deployment/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── lib/
│   │   └── api.ts       # API client (configured for Lambda endpoints)
│   ├── services/        # Services (Polly, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript types
│   └── App.tsx          # Main app component
├── public/              # Static assets
├── dist/                # Build output (after npm run build)
├── package.json         # Dependencies
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── amplify.yml          # Amplify build configuration
└── .env                 # Environment variables (gitignored)
```

## API Endpoints Reference

All endpoints require JWT authentication in the `Authorization` header.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login user |
| `/riddles/random` | GET | Get random riddle |
| `/riddles/validate` | POST | Validate answer |
| `/riddles/solve` | POST | Update progress |
| `/riddles/progress` | GET | Get player progress |

---

**Last Updated:** November 2025
