# Fix: "Expected JavaScript Module" Error

This error means the Amplify build failed or didn't complete properly.

---

## 🔍 Root Cause

The error:
```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "text/html"
```

Means:
- ❌ The JavaScript bundle wasn't built
- ❌ Amplify is serving the error page (HTML) instead of your app
- ❌ The build failed silently

---

## 🚀 Solution: Check and Fix Build

### Step 1: Check Amplify Build Logs

1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/
2. Select your app: `riddlers-cipher-frontend`
3. Click on the failed deployment
4. Scroll down to **Build logs**
5. Look for errors (usually in red)

**Common errors:**
- TypeScript compilation errors
- Missing dependencies
- Import errors
- Syntax errors

### Step 2: Test Build Locally

Run the build command locally to see the error:

```powershell
npm install
npm run build
```

This will show you the exact error preventing the build.

### Step 3: Fix Common Issues

#### Issue 1: TypeScript Errors

**Error:** `Property 'env' does not exist on type 'ImportMeta'`

**Fix:** Add type definition to `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

#### Issue 2: Missing Dependencies

**Error:** `Cannot find module '@/...'`

**Fix:** Run:
```powershell
npm install
```

#### Issue 3: Build Output Directory

**Error:** `dist` directory not created

**Fix:** Verify `vite.config.ts` has correct output:

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
```

---

## 📋 Step-by-Step Fix

### Step 1: Test Build Locally

```powershell
# Navigate to project
cd d:\riddlers-cipher-pre-deployment

# Install dependencies
npm install

# Build
npm run build

# Check for errors
```

If build succeeds, you'll see:
```
✓ 1234 modules transformed
dist/index.html                    1.23 kb
dist/assets/main.abc123.js         456.78 kb
dist/assets/style.def456.css       123.45 kb
```

### Step 2: Fix TypeScript Errors

If you see TypeScript errors, check `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Step 3: Verify Vite Config

Check `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
```

### Step 4: Verify amplify.yml

Check `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### Step 5: Push Changes

```powershell
git add .
git commit -m "Fix: Build configuration and TypeScript errors"
git push origin main
```

### Step 6: Check Amplify Build

1. Go to Amplify Console
2. Wait for new build to start
3. Monitor build logs
4. Should complete successfully

---

## 🧪 Verify Build Locally

Before pushing, verify the build works:

```powershell
# Clean build
rm -r dist
npm run build

# Check output
ls dist/
```

You should see:
- `index.html`
- `assets/` folder with `.js` and `.css` files

---

## 🔧 Common Fixes

### Fix 1: Add vite-env.d.ts

If missing, create `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Fix 2: Update vite.config.ts

Make sure it has:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

### Fix 3: Check package.json

Verify build script:
```json
"scripts": {
  "build": "vite build",
  ...
}
```

### Fix 4: Clear npm cache

```powershell
npm cache clean --force
rm -r node_modules
npm install
npm run build
```

---

## 📊 Debugging Checklist

- [ ] Run `npm run build` locally
- [ ] Check for TypeScript errors
- [ ] Verify `dist/` folder is created
- [ ] Check `dist/index.html` exists
- [ ] Check `dist/assets/` has `.js` files
- [ ] Verify `vite.config.ts` is correct
- [ ] Verify `amplify.yml` is correct
- [ ] Verify `src/vite-env.d.ts` exists
- [ ] Push changes to GitHub
- [ ] Check Amplify build logs
- [ ] Verify build completes successfully

---

## 🚀 Next Steps

1. **Test build locally:**
   ```powershell
   npm install
   npm run build
   ```

2. **Fix any errors** shown in console

3. **Push to GitHub:**
   ```powershell
   git add .
   git commit -m "Fix: Build configuration"
   git push origin main
   ```

4. **Check Amplify Console** for new build

5. **Monitor build logs** for errors

6. **Test deployed app** when build completes

---

## 📞 If Still Not Working

1. Go to Amplify Console
2. Click on failed deployment
3. Scroll to **Build logs**
4. Copy the error message
5. Share with me and I'll help fix it

---

**Run `npm run build` locally first to see the exact error! 👇**
