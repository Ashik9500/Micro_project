# 🚀 AssemblyFlow Deployment Guide

AssemblyFlow can be deployed either as a **unified single-service full-stack web application** (recommended) or as **decoupled services** (Frontend on Vercel/Netlify + Backend on Render/Railway).

---

## ⚡ Quick Architecture Overview

- **Backend**: Express + TypeScript REST API (`/api/*`)
- **Frontend**: React 19 + TypeScript + Vite Single Page Application
- **Unified Mode**: In production, the backend automatically detects and serves the built static frontend assets (`frontend/dist`), providing both API endpoints and the rich interactive UI on a single port (`process.env.PORT` or `5000`) with zero CORS complications.

---

## 🌟 Option 1: 1-Click Free Cloud Deployment on Render (Recommended)

Render offers a generous free tier ideal for student and academic micro-projects.

### Step-by-Step Instructions:

1. **Push your project to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete AssemblyFlow production deployment setup"
   git remote add origin https://github.com/<your-username>/assemblyflow.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/) and click **"New +"** $\rightarrow$ **"Web Service"**.
   - Connect your GitHub repository.
   - Configure the following settings:
     - **Name**: `assemblyflow`
     - **Language / Environment**: `Node`
     - **Region**: Closest to you (e.g., Oregon, Frankfurt, Singapore)
     - **Branch**: `main`
     - **Root Directory**: `.` *(leave empty / root)*
     - **Build Command**: `npm run install:all && npm run build`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free`
   - Under **Advanced / Environment Variables**, add:
     - `NODE_ENV` = `production`
   - Under **Health Check Path**, enter: `/api/health`
   - Click **"Create Web Service"**.

3. **Verify Deployment**:
   - Render will build both frontend and backend and start the application.
   - Once the live URL is generated (e.g., `https://assemblyflow.onrender.com`), navigate to it in your browser.
   - Both the full user interface and `/api/health` will be immediately accessible!

> **Note**: A pre-configured `render.yaml` blueprint is already included in the root directory for automated setup.

---

## 🐳 Option 2: Docker Container Deployment

A multi-stage `Dockerfile` is provided in the repository.

### 1. Build the Docker Image:
```bash
docker build -t assemblyflow .
```

### 2. Run the Container:
```bash
docker run -d -p 5000:5000 --name assemblyflow-app assemblyflow
```

### 3. Open in Browser:
- Application UI: `http://localhost:5000`
- API Health Check: `http://localhost:5000/api/health`

This image can be deployed directly to:
- **AWS ECS / App Runner**
- **Google Cloud Run**
- **DigitalOcean App Platform**
- **Fly.io** (`fly launch`)
- **Railway**

---

## 🌐 Option 3: Decoupled Deployment (Frontend on Vercel + Backend on Render/Railway)

If you prefer hosting the React frontend on Vercel and the Express API on Render or Railway:

### 1. Deploy the Backend:
- Follow standard Node deployment on Render / Railway with:
  - **Root Directory**: `assemblyflow/backend`
  - **Build Command**: `npm install && npm run build`
  - **Start Command**: `npm start`
- Copy your deployed backend URL (e.g. `https://assemblyflow-api.onrender.com`).

### 2. Deploy the Frontend on Vercel:
- Go to [Vercel](https://vercel.com/) $\rightarrow$ **"Add New Project"**.
- Select your repository.
- Set **Root Directory** to `assemblyflow/frontend`.
- Under **Environment Variables**, add:
  - `VITE_API_BASE_URL` = `https://assemblyflow-api.onrender.com` *(your backend URL without trailing slash)*
- Click **"Deploy"**.
- A `vercel.json` rewrite file is already configured in `assemblyflow/frontend` to handle single-page application routing.

---

## 💻 Option 4: Local Production Test

To test production mode locally on your machine:

```powershell
# 1. From workspace root: Build both frontend and backend
npm run build

# 2. Start the unified production server
npm start
```

Then visit:
- **Dashboard**: `http://localhost:5000`
- **Health check**: `http://localhost:5000/api/health`

---

## 🧪 Verification & Health Check Checklist Before Submitting

Run these commands locally to guarantee that everything is 100% green:

```powershell
# Run backend test suite (67 tests, 12 suites)
npm test

# Run frontend linter (0 errors, 0 warnings)
npm run lint

# Run full project production build
npm run build
```
