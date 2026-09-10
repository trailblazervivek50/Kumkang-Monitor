# Kumkang Live Project Monitoring System

An enterprise dashboard built to provide real-time visibility into project lifecycles, covering design, production, shipment, and payments.

## 🚀 Tech Stack

- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React

## 📦 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## ☁️ Vercel Deployment

This project is pre-configured for Vercel deployment with a `vercel.json` file.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftrailblazervivek50%2FKumgang)

### Manual Deployment
1. Import this repository into your Vercel dashboard.
2. Vercel will automatically detect **Vite** as the framework.
3. The Build Command (`npm run build`) and Output Directory (`dist`) are automatically configured via `vercel.json`.
4. Click **Deploy**.

*Note: The `vercel.json` file includes a rewrite rule to ensure SPA routing works seamlessly on Vercel.*
