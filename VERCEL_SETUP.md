# Vercel Deployment Configuration

## Issue: 404 Error on Vercel

Your Next.js app is located in the `my-app` subdirectory, but Vercel needs to be configured to use this as the root directory.

## Solution

1. Go to your Vercel project dashboard: https://vercel.com/usman-zaibs-projects/solar-revive
2. Navigate to **Settings** → **General**
3. Scroll down to **Root Directory**
4. Set the Root Directory to: `my-app`
5. Click **Save**
6. Redeploy your project (or push a new commit to trigger a redeploy)

## Required Environment Variables

Make sure these environment variables are set in Vercel (Settings → Environment Variables):

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `ADMIN_EMAIL` - Admin email for login
- `ADMIN_PASSWORD` - Admin password for login

## After Configuration

Once you've set the root directory and environment variables, your deployment should work correctly and the 404 error should be resolved.

