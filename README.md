# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/ff33cb21-304f-4709-805b-0b34c8af6c4d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ff33cb21-304f-4709-805b-0b34c8af6c4d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Deploy to AWS Amplify (Production)

This project is configured to deploy to AWS Amplify with integration to AWS Lambda + API Gateway backend.

**Quick Start:**
1. Follow the [AWS Amplify Deployment Guide](./AMPLIFY_DEPLOYMENT_GUIDE.md)
2. Set environment variable: `VITE_API_BASE_URL=https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod`
3. Deploy to Amplify

**Verification:**
- Run `powershell -ExecutionPolicy Bypass -File verify-api-integration.ps1` to test API endpoints
- Use the [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) to verify all functionality

### Deploy via Lovable (Development)

Simply open [Lovable](https://lovable.dev/projects/ff33cb21-304f-4709-805b-0b34c8af6c4d) and click on Share -> Publish.

## Backend Integration

This frontend is configured to work with AWS Lambda + API Gateway backend:

**API Base URL:** `https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod`

**Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /riddles/random` - Get random riddle
- `POST /riddles/validate` - Validate answer
- `POST /riddles/solve` - Update player progress
- `GET /riddles/progress` - Get player progress

All endpoints require JWT authentication in the `Authorization` header.

## Local Development

1. Create `.env` file with:
   ```
   VITE_API_BASE_URL=https://pit5nsq8w0.execute-api.ap-southeast-2.amazonaws.com/prod
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. For detailed setup instructions, see [Local Environment Setup](./SETUP_LOCAL_ENV.md)

## Can I connect a custom domain to my Amplify project?

Yes, you can!

To connect a domain:
1. Go to Amplify Console → App settings → Domain management
2. Click "Add domain"
3. Enter your domain and configure DNS records
4. Amplify will provision SSL certificates automatically

For more details, see [AWS Amplify Deployment Guide](./AMPLIFY_DEPLOYMENT_GUIDE.md)
