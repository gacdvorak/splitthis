# SplitThis Cloud Functions

Firebase Cloud Functions for sending automated emails when users are added to expense buckets.

## Setup

1. **Install dependencies:**
   ```bash
   cd functions
   npm install
   ```

2. **Configure environment variables:**

   You need to set up the following environment variables in Firebase:

   - `RESEND_API_KEY`: Your Resend API key (get one at https://resend.com)
   - `FROM_EMAIL`: The email address to send from (must be verified in Resend)
   - `APP_URL`: Your app's URL (e.g., https://splitthis.app or http://localhost:5173 for local dev)

   **Set environment variables:**
   ```bash
   firebase functions:config:set resend.api_key="YOUR_RESEND_API_KEY"
   firebase functions:config:set email.from="SplitThis <noreply@yourdomain.com>"
   firebase functions:config:set app.url="https://splitthis.app"
   ```

   **For local development**, create a `.env` file in the `functions` directory:
   ```bash
   cp .env.example .env
   # Then edit .env with your actual values
   ```

3. **Build the functions:**
   ```bash
   npm run build
   ```

## Development

**Run functions locally with emulator:**
```bash
npm run serve
```

## Deployment

**Deploy functions to Firebase:**
```bash
npm run deploy
```

Or deploy from the project root:
```bash
firebase deploy --only functions
```

## Functions

### sendInvitationEmail

Automatically triggered when a new invitation is created in Firestore. Sends an email to the invited person with:
- Bucket name
- Link to accept the invitation
- Inviter information

**Trigger:** `invitations/{invitationId}` onCreate

## Email Service

This project uses [Resend](https://resend.com) for sending emails. Resend offers:
- 100 emails/day on the free tier
- 3,000 emails/month on the free tier
- Simple API
- No credit card required for free tier

### Setting up Resend

1. Go to https://resend.com and create an account
2. Verify your domain (or use the testing domain for development)
3. Get your API key from the dashboard
4. Add the API key to Firebase config as shown above

## Troubleshooting

**Functions not deploying?**
- Make sure you're on the Blaze (pay-as-you-go) plan in Firebase
- Check that Node.js 18 is available in your Firebase project

**Emails not sending?**
- Verify your Resend API key is correct
- Check that your FROM_EMAIL domain is verified in Resend
- Look at function logs: `npm run logs`

**Testing locally?**
- Use Firebase emulators: `npm run serve`
- Check the emulator logs for errors
- Make sure your .env file is properly configured
