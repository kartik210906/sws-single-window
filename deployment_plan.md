# SWS Cloud Deployment Blueprint (Vercel + GitHub + Render + Supabase + MongoDB Atlas)

This blueprint outlines how to migrate your local Single Window System (SWS) stack to free cloud hosting platforms for the Smart India Hackathon.

---

## 1. Codebase Hosting (GitHub)

We will package the backend, frontend, and AI microservices in a single repository. 
To push this code to GitHub:
1. Create a new empty repository on your GitHub account (do not initialize with README or license).
2. Open terminal in the project directory and run:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. Cloud Databases Setup

### PostgreSQL (Auth & Application Queue)
1. Sign up on [Supabase](https://supabase.com/) or [Neon.tech](https://neon.tech/) (both offer free PostgreSQL databases).
2. Create a new database project.
3. Retrieve your connection string. It will look like:
   ```text
   postgresql://postgres:password@ep-cool-waterfall-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Note down this URI. You will feed this as `DATABASE_URL` to your Express backend.

### MongoDB (Dynamic Form Schemas)
1. Sign up on [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) (free Shared Cluster M0).
2. Create a database user and configure IP Access List (choose `0.0.0.0/0` to allow access from any hosting platform).
3. Retrieve your connection string under **Connect** -> **Drivers**:
   ```text
   mongodb+srv://admin_user:<password>@cluster0.abcde.mongodb.net/sws_db?retryWrites=true&w=majority
   ```
4. Note down this URI. You will feed this as `MONGO_URI` to your Express backend.

---

## 3. Web Service Hosting (Render.com)

[Render](https://render.com/) allows free deployment of web services directly from GitHub.

### Deploy the Node.js Express Backend
1. Sign in to Render and click **New** -> **Web Service**.
2. Link your GitHub repository.
3. Configure the service settings:
   - **Name**: `sws-express-backend`
   - **Region**: `Singapore` (or closest to India for low latency)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
4. Add **Environment Variables**:
   - `PORT`: `5000`
   - `MONGO_URI`: *(Your MongoDB Atlas URI)*
   - `DATABASE_URL`: *(Your Supabase/Neon PostgreSQL URI)*
5. Click **Deploy**. Note down your backend URL (e.g., `https://sws-express-backend.onrender.com`).

### Deploy the FastAPI AI Service
1. Click **New** -> **Web Service** on Render.
2. Link your GitHub repository.
3. Configure the service settings:
   - **Name**: `sws-fastapi-ai`
   - **Root Directory**: `ai-service`
   - **Runtime**: `Python` (or `Docker` if utilizing our Dockerfile)
   - **Build Command**: `pip install -r requirements.txt && python -c "import easyocr; reader = easyocr.Reader(['en'], gpu=False)"` *(caches models)*
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
4. Add **Environment Variables**:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
5. Click **Deploy**. Note down your AI service URL (e.g., `https://sws-fastapi-ai.onrender.com`).

---

## 4. Frontend Deployment (Vercel)

[Vercel](https://vercel.com/) is the native hosting platform for Next.js and deploys in seconds.

1. Sign up on Vercel and click **Add New** -> **Project**.
2. Import your SWS GitHub repository.
3. Configure the project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
4. Expand **Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL`: *(Your Render Express backend URL)*
   - `NEXT_PUBLIC_AI_SERVICE_URL`: *(Your Render FastAPI AI URL)*
5. Click **Deploy**. 

Vercel will build your Next.js application, compile the TypeScript layouts, and provide you with a production-ready `.vercel.app` URL for your SIH presentation.
