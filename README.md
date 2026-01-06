# SplitThis - Expense Splitting PWA

A Progressive Web App for splitting expenses between people. Built with React, TypeScript, Firebase, and Tailwind CSS.

## Features

- **Expense Buckets**: Organize expenses by theme/event with custom currencies
- **People Management**: Add participants via email to share expenses
- **Flexible Splitting**: Split expenses evenly or with custom percentages
- **Expenses & Credits**: Track both expenses and positive credits
- **Smart Settlements**: Automatically calculate optimal payment settlements
- **Real-time Sync**: Changes sync instantly across all devices via Firebase
- **Offline Support**: PWA capabilities with offline access
- **Dark Mode**: Beautiful dark theme optimized for mobile
- **Mobile-First**: Native-like mobile experience

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore + Authentication)
- **PWA**: Vite PWA Plugin
- **Routing**: React Router

## Prerequisites

- Node.js 18+ and npm
- A Firebase account (free tier is sufficient)

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "splitthis")
4. Disable Google Analytics (optional for personal use)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Click on **Email/Password** in Sign-in providers
4. Enable **Email/Password** (leave Email link disabled)
5. Click "Save"

### 3. Create Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Select **Start in production mode**
4. Choose a location close to you
5. Click "Enable"

### 4. Deploy Security Rules

1. In Firestore Database, go to the **Rules** tab
2. Replace the default rules with the content from `firestore.rules` in this repo
3. Click "Publish"

### 5. Get Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register app with nickname "SplitThis Web"
5. Copy the `firebaseConfig` object values

### 6. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase config values in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

## Building for Production

1. Build the app:
   ```bash
   npm run build
   ```

2. Preview the production build:
   ```bash
   npm run preview
   ```

## Deployment

### Deploy to Firebase Hosting (Recommended)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase Hosting:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to: `dist`
   - Configure as single-page app: `Yes`
   - Set up automatic builds: `No`

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

Your app will be live at: `https://your-project-id.web.app`

### Other Deployment Options

- **Vercel**: Connect your GitHub repo to Vercel, set environment variables
- **Netlify**: Same as Vercel
- **Any static host**: Upload the `dist` folder contents

## Usage

### First Time Setup

1. Create an account with email and password
2. Create your first expense bucket
3. Add your partner via their email
4. Start adding expenses!

### Adding Expenses

1. Open a bucket
2. Tap the blue "+" button
3. Fill in:
   - Title (e.g., "Dinner at restaurant")
   - Amount
   - Who paid
   - Split type (even or custom percentages)
   - Notes (optional)
4. Save

### Adding Credits

1. Open a bucket
2. Tap the green "+" button (for credits)
3. Fill in similar details as expenses
4. Save

### Viewing Settlements

1. Open a bucket
2. Go to "Settlement" tab
3. See who owes whom and suggested payments

## Project Structure

```
src/
├── components/          # React components
│   ├── CreditForm.tsx
│   ├── ExpenseForm.tsx
│   └── ParticipantManager.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── hooks/              # Custom React hooks
│   ├── useBuckets.ts
│   ├── useCredits.ts
│   └── useExpenses.ts
├── lib/                # Library configurations
│   └── firebase.ts
├── pages/              # Page components
│   ├── BucketDetail.tsx
│   ├── Buckets.tsx
│   └── Login.tsx
├── types/              # TypeScript types
│   └── index.ts
├── utils/              # Utility functions
│   └── settlements.ts
├── App.tsx             # Main app component
├── main.tsx           # App entry point
└── index.css          # Global styles
```

## Key Features Explained

### Settlement Algorithm

The app uses a greedy algorithm to minimize the number of transactions:
1. Calculate net balance for each person
2. Find the person who owes the most
3. Find the person who is owed the most
4. Create a payment between them
5. Repeat until all debts are settled

### Participant Management

- Currently uses a simplified email-based system
- When you add someone via email, a temporary user is created
- They can create their own account with the same email to claim ownership
- All participants see the same data in real-time

### Offline Support

- PWA caching allows the app to work offline
- Firebase Firestore automatically syncs when back online
- Perfect for splitting expenses during travel

## Security

- Firestore security rules ensure users can only:
  - Read/write buckets they participate in
  - Create expenses/credits in their buckets
  - Not access other users' data
- All authentication handled by Firebase Auth
- Environment variables keep your Firebase config secure

## Tips for Personal Use

- **Backup**: Export data periodically (Firebase Console → Firestore → Export)
- **Free Tier Limits**:
  - 50k reads/day
  - 20k writes/day
  - 1 GB storage
  - More than enough for 2 people!
- **Mobile Install**:
  - iOS Safari: Tap Share → Add to Home Screen
  - Android Chrome: Tap menu → Install app

## Troubleshooting

### App shows "Bucket not found"
- Check Firestore security rules are deployed
- Ensure you're logged in with the correct account

### Changes not syncing
- Check internet connection
- Verify Firebase config in `.env`
- Check browser console for errors

### PWA not installing
- Ensure app is served over HTTPS
- Clear browser cache
- Check browser console for PWA errors

## License

MIT

## Support

For issues or questions, open an issue on GitHub.
