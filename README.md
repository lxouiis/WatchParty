# Netmirror Party (DRM-safe)

A modern, sleek, mobile-first watch-party app.

## Prerequisites

- Node.js 20+
- npm

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   npm run build --workspace=@netmirror/shared
   ```

2. **Environment Variables**
   
   Create `.env` in `apps/server`:
   ```env
   PORT=4000
   ```

   (Optional) Create `.env.local` in `apps/web` if hosting server elsewhere:
   ```env
   NEXT_PUBLIC_WS_URL=http://localhost:4000/party
   ```

3. **Run Locally**
   To run both backend and frontend concurrently:
   ```bash
   npm run dev
   ```
   
   - Web: [http://localhost:3000](http://localhost:3000)
   - Server: http://localhost:4000

## Deployment

### Backend (apps/server)
Deploy to a WebSocket-friendly platform like Render, Railway, or Fly.io.
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Env**: Set `PORT` (usually automatic).

### Frontend (apps/web)
Deploy to Vercel.
- **Root Directory**: `apps/web` (or configure Vercel to handle monorepo)
- **Env**: Set `NEXT_PUBLIC_WS_URL` to your production backend URL (e.g., `https://my-backend.onrender.com/party`). Note the `/party` namespace if using namespaces.

### Development Tunnel
To test with friends without deploying, use Cloudflare Tunnel or ngrok to expose localhost:4000 and localhost:3000.
