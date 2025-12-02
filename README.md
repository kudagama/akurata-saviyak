# අකුරට සවියක් - Donation Platform

A donation platform for the **2018 O/L and 2021 A/L Batch Support** to the **අකුරට සවියක්** project in Galle St. Aloysius College.

## Features

- 💰 Money donations with receipt verification
- 📦 Item/material donations
- 👨‍💼 Admin panel for managing donations
- 📊 Real-time statistics and reports
- 📱 Fully responsive design
- 🖨️ Print reports functionality

## Tech Stack

- React 19
- Vite
- Firebase (Firestore)
- Tailwind CSS
- Lucide React Icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Firestore enabled

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd akurata_saviyak
```

2. Install dependencies
```bash
npm install
```

3. Configure Firebase
   - Update Firebase configuration in `src/App.jsx`
   - Ensure Firestore is enabled in your Firebase project

4. Run development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
```

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

2. Login to Vercel
```bash
vercel login
```

3. Deploy
```bash
vercel
```

4. For production deployment
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "New Project"

4. Import your repository

5. Vercel will auto-detect Vite configuration:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. Add Environment Variables (if needed):
   - Go to Project Settings → Environment Variables
   - Add any required environment variables

7. Click "Deploy"

### Configuration

The project includes a `vercel.json` file with the following configuration:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite
- SPA routing support (all routes redirect to index.html)

### Environment Variables

If you need to use environment variables:
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add your variables (e.g., Firebase config if externalized)

## Admin Access

- Admin PIN: `2024` (change in `src/App.jsx`)

## Contact

For inquiries, contact: Saveen - 076 608 8374

## License

Private project for Galle St. Aloysius College
