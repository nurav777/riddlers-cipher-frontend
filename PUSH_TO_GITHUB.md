# Push Frontend to GitHub - Step by Step

Your frontend needs to be on GitHub for AWS Amplify to deploy it. Follow these steps.

---

## 📋 Prerequisites

- GitHub account (create at https://github.com if needed)
- Git installed on your computer
- Your frontend code ready (it is! ✅)

---

## 🚀 Step 1: Create GitHub Repository

### Option A: Create New Repository on GitHub

1. Go to https://github.com/new
2. Enter repository name: `riddlers-cipher-frontend` (or any name)
3. Description: `Gotham Cipher Frontend - React + Vite`
4. Choose visibility:
   - **Public** - Anyone can see (recommended for Amplify)
   - **Private** - Only you can see
5. Click "Create repository"

### Option B: Use Existing Repository

If you already have a repository, skip to Step 2.

---

## 💻 Step 2: Initialize Git in Your Project

Open PowerShell in your project directory and run:

```powershell
# Navigate to project directory
cd d:\riddlers-cipher-pre-deployment

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Gotham Cipher frontend with Lambda integration"

# Add remote repository (replace USERNAME and REPO)
git remote add origin https://github.com/USERNAME/riddlers-cipher-frontend.git

# Verify remote
git remote -v
```

Expected output:
```
origin  https://github.com/USERNAME/riddlers-cipher-frontend.git (fetch)
origin  https://github.com/USERNAME/riddlers-cipher-frontend.git (push)
```

---

## 📤 Step 3: Push to GitHub

### First Push (Create main branch)

```powershell
# Push to GitHub (creates main branch)
git branch -M main
git push -u origin main
```

You'll be prompted for credentials:
- **Username:** Your GitHub username
- **Password:** Your GitHub personal access token (not your password!)

### Create Personal Access Token (if needed)

If you don't have a token:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token"
3. Select scopes: `repo` (full control of private repositories)
4. Click "Generate token"
5. Copy the token (you won't see it again!)
6. Use this token as your password when pushing

---

## ✅ Step 4: Verify Push

1. Go to your GitHub repository: `https://github.com/USERNAME/riddlers-cipher-frontend`
2. You should see all your files
3. Check that `.env` file is there (it should be, since it's not in .gitignore)

---

## 🔄 Step 5: Connect to AWS Amplify

Now that your code is on GitHub, connect it to Amplify:

### 1. Go to AWS Amplify Console

```
https://console.aws.amazon.com/amplify/
```

### 2. Click "Create new app" → "Host web app"

```
┌─────────────────────────────────────────┐
│ Create new app                          │
│ ┌─────────────────────────────────────┐ │
│ │ ○ Deploy without Git                │ │
│ │ ○ Host web app  ← Select this       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 3. Select GitHub

```
┌─────────────────────────────────────────┐
│ Connect repository                      │
│ ┌─────────────────────────────────────┐ │
│ │ ○ GitHub      ← Select this         │ │
│ │ ○ GitLab                            │ │
│ │ ○ Bitbucket                         │ │
│ │ ○ AWS CodeCommit                    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 4. Authorize AWS

Click "Authorize with GitHub" and follow the prompts to give AWS Amplify access to your GitHub account.

### 5. Select Your Repository

```
┌─────────────────────────────────────────┐
│ Select repository                       │
│ ┌─────────────────────────────────────┐ │
│ │ Search: [___________________]       │ │
│ │                                     │ │
│ │ ☑ riddlers-cipher-frontend         │ │
│ │   ← Select your repository          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Next]  ← Click                         │
└─────────────────────────────────────────┘
```

### 6. Select Branch

```
┌─────────────────────────────────────────┐
│ Select branch                           │
│ ┌─────────────────────────────────────┐ │
│ │ Branch: [main ▼]  ← Select main    │ │
│ │                                     │ │
│ │ ☑ main                              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Next]  ← Click                         │
└─────────────────────────────────────────┘
```

### 7. Configure Build Settings

Verify these settings:

```
┌─────────────────────────────────────────┐
│ Build settings                          │
│ ┌─────────────────────────────────────┐ │
│ │ Build command: npm run build        │ │
│ │ Build output: dist                  │ │
│ │ Node version: 18                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Next]  ← Click                         │
└─────────────────────────────────────────┘
```

### 8. Add Environment Variables

**IMPORTANT:** Add this environment variable:

```
┌─────────────────────────────────────────┐
│ Environment variables                   │
│ ┌─────────────────────────────────────┐ │
│ │ Variable name:                      │ │
│ │ [VITE_API_BASE_URL]                 │ │
│ │                                     │ │
│ │ Value:                              │ │
│ │ [https://pit5nsq8w0.execute-api.    │ │
│ │  ap-southeast-2.amazonaws.com/prod] │ │
│ │                                     │ │
│ │ [+ Add variable]                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Save and deploy]  ← Click              │
└─────────────────────────────────────────┘
```

### 9. Review and Deploy

```
┌─────────────────────────────────────────┐
│ Review                                  │
│ ┌─────────────────────────────────────┐ │
│ │ Repository: riddlers-cipher-...     │ │
│ │ Branch: main                        │ │
│ │ Build command: npm run build        │ │
│ │ Output: dist                        │ │
│ │ Environment: VITE_API_BASE_URL=...  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Save and deploy]  ← Final step!        │
└─────────────────────────────────────────┘
```

### 10. Wait for Deployment

```
┌─────────────────────────────────────────┐
│ Deployment in progress...               │
│ ┌─────────────────────────────────────┐ │
│ │ ⏳ Provisioning                      │ │
│ │ ⏳ Building                          │ │
│ │ ⏳ Deploying                         │ │
│ │ ⏳ Verifying                         │ │
│ │                                     │ │
│ │ Build time: 2:45                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Refresh page to see updates             │
└─────────────────────────────────────────┘
```

Wait 5-10 minutes for deployment to complete.

### 11. Get Your Live URL

```
┌─────────────────────────────────────────┐
│ Deployment successful! ✅               │
│ ┌─────────────────────────────────────┐ │
│ │ URL: https://main.d1234567890.      │ │
│ │      amplifyapp.com                 │ │
│ │                                     │ │
│ │ [Visit app]  ← Click to open        │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 📝 Complete Command Sequence

Here's all the commands you need to run:

```powershell
# 1. Navigate to project
cd d:\riddlers-cipher-pre-deployment

# 2. Initialize git
git init

# 3. Add all files
git add .

# 4. Create initial commit
git commit -m "Initial commit: Gotham Cipher frontend with Lambda integration"

# 5. Add remote (replace USERNAME and REPO)
git remote add origin https://github.com/USERNAME/riddlers-cipher-frontend.git

# 6. Create main branch and push
git branch -M main
git push -u origin main

# Done! ✅
```

---

## ✅ Verification Checklist

- [ ] GitHub account created
- [ ] Repository created on GitHub
- [ ] Git initialized in project
- [ ] All files committed
- [ ] Remote added
- [ ] Code pushed to GitHub
- [ ] Repository visible on GitHub
- [ ] AWS Amplify connected to GitHub
- [ ] Environment variable set
- [ ] Deployment started
- [ ] Deployment completed
- [ ] Live URL accessible

---

## 🆘 Troubleshooting

### Issue: "fatal: not a git repository"

**Solution:**
```powershell
git init
```

### Issue: "remote origin already exists"

**Solution:**
```powershell
git remote remove origin
git remote add origin https://github.com/USERNAME/REPO.git
```

### Issue: "Authentication failed"

**Solution:**
1. Use personal access token instead of password
2. Create token at: https://github.com/settings/tokens
3. Use token as password when pushing

### Issue: ".env file not pushed"

**Solution:**
The `.env` file should be pushed. If it's not:
```powershell
git add .env
git commit -m "Add environment variables"
git push
```

### Issue: "Repository not showing in Amplify"

**Solution:**
1. Refresh the page
2. Re-authorize GitHub connection
3. Check repository is public (or private with proper permissions)

---

## 🚀 Next Steps After Push

1. ✅ Push code to GitHub (you are here)
2. ✅ Connect to AWS Amplify Console
3. ✅ Set environment variable
4. ✅ Click "Save and deploy"
5. ✅ Wait 5-10 minutes
6. ✅ Open live URL
7. ✅ Test all features
8. ✅ Share with team

---

## 📊 Timeline

```
Now: Push to GitHub (5 min)
  ↓
Connect to Amplify (2 min)
  ↓
Set environment variable (1 min)
  ↓
Click deploy (1 min)
  ↓
Wait for build (5-10 min)
  ↓
✅ LIVE! (15 minutes total)
```

---

## 💡 Pro Tips

1. **Use a descriptive commit message** - Helps track changes
2. **Push frequently** - Amplify will auto-deploy on push
3. **Check build logs** - If deployment fails, check logs in Amplify Console
4. **Test locally first** - Run `npm run build` before pushing
5. **Keep .env updated** - Update environment variables in Amplify Console, not in .env file

---

## 📞 Support

- [GitHub Documentation](https://docs.github.com/)
- [Git Documentation](https://git-scm.com/doc)
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)

---

**Ready to push? Follow the commands above! 🚀**

---

**Last Updated:** November 2025
**Status:** Ready to Deploy
**Time to Deploy:** 15 minutes total
