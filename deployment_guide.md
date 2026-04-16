# LumBarong Deployment Guide

Follow these steps to deploy your application to the cloud.

## 1. Database (Aiven MySQL)
1.  Sign up at [Aiven.io](https://aiven.io/).
2.  Create a new **MySQL** service (the Free Tier is sufficient).
3.  Once the service is running, find your connection details:
    - **Host**: (e.g., `mysql-1234.aivencloud.com`)
    - **Port**: (e.g., `12345`)
    - **User**: `avnadmin`
    - **Password**: (provided in Aiven dashboard)
    - **Database Name**: `defaultdb` (or create a new one named `lumbarong`)

## 2. Backend (Render or Railway)
### Option A: Render
1.  Connect your GitHub repository to [Render](https://render.com/).
2.  Create a new **Web Service**.
3.  Select the `backend` directory as the Root Directory.
4.  Set the environment variables:
    - `DB_HOST`: Your Aiven Host
    - `DB_PORT`: Your Aiven Port
    - `DB_USER`: `avnadmin`
    - `DB_PASS`: Your Aiven Password
    - `DB_NAME`: `defaultdb`
    - `DB_DIALECT`: `mysql`
    - `JWT_SECRET`: A long random string
    - `FRONTEND_URL`: Your Vercel URL (add this *after* the frontend is deployed)
    - `RESEND_API_KEY`: Optional, required for production password reset emails
    - `MAIL_FROM`: Optional, required with `RESEND_API_KEY` (for example `Lumbarong <onboarding@resend.dev>`)
    - `PASSWORD_RESET_TTL_MINUTES`: Optional, defaults to `60`

## 3. Frontend (Vercel)
1.  Connect your GitHub repository to [Vercel](https://vercel.com/).
2.  Select the `frontend` directory as the Root Directory.
3.  Add the following Environment Variable:
    - `NEXT_PUBLIC_API_URL`: `https://your-backend-url.onrender.com/api/v1`
4.  Deploy!

## 4. Final Link
1.  Once your Vercel URL is ready (e.g., `https://lumbarong.vercel.app`), go back to your Backend settings and update `FRONTEND_URL` to match it.
2.  Restart the Backend service to apply the changes.
