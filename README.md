# AssemblyFlow — Micro Project

> **Automated Assembly Code Normalizer & Pipelined Execution Analyzer**

This workspace contains the college project **AssemblyFlow**:
- **Main project folder**: [`assemblyflow/`](./assemblyflow/)
- **Setup & architecture guide**: [`assemblyflow/README.md`](./assemblyflow/README.md)
- **Deployment guide (Render, Docker, Vercel)**: [`DEPLOYMENT.md`](./DEPLOYMENT.md)

---

## ⚡ Quick Start

### 1. Run in Development Mode:
```powershell
# Terminal 1 - Backend:
cd assemblyflow/backend
npm run dev

# Terminal 2 - Frontend:
cd assemblyflow/frontend
npm run dev
```

### 2. Run in Unified Production Mode:
```powershell
# Build both frontend and backend
npm run build

# Start the unified server (Serves both UI & API on port 5000)
npm start
```

### 3. Run Automated Tests:
```powershell
npm test
```
All 67 tests across 12 test suites pass with 0 errors.

---

## 🚀 Ready for Cloud Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for 1-click deployment options on **Render**, **Docker**, and **Vercel**.
