# Email Notifications Setup Guide

This guide will help you set up automated email notifications for SplitThis, so users receive an email when they're added to a bucket.

## Overview

When someone is added to a bucket, they will automatically receive an email with:
- The bucket name
- A direct link to access the bucket
- Information about who added them

## Prerequisites

1. **Firebase Blaze Plan**: Cloud Functions require the Firebase Blaze (pay-as-you-go) plan
   - Go to Firebase Console → Upgrade
   - Don't worry - the free tier is generous and you likely won't be charged for normal usage

2. **Resend Account**: Free email sending service
   - Sign up at https://resend.com
   - Free tier: 100 emails/day, 3,000 emails/month
   - No credit card required

## Step 1: Set Up Resend

1. **Create a Resend account** at https://resend.com

2. **Get your API key:**
   - Go to API Keys in your Resend dashboard
   - Click "Create API Key"
   - Copy the key (starts with `re_`)

3. **Verify your domain (optional but recommended):**
   - For production: Add and verify your domain in Resend
   - For development/testing: You can use Resend's test domain

## Step 2: Install Functions Dependencies

```bash
cd functions
npm install
```

## Step 3: Configure Environment Variables

You need to set three environment variables in Firebase:

```bash
# Set your Resend API key
firebase functions:config:set resend.api_key="re_your_actual_api_key_here"

# Set the "from" email address
# For testing, use: onboarding@resend.dev
# For production, use your verified domain
firebase functions:config:set email.from="SplitThis <noreply@yourdomain.com>"

# Set your app URL
firebase functions:config:set app.url="https://your-app-url.web.app"
```

**Verify your config:**
```bash
firebase functions:config:get
```

## Step 4: Update Cloud Function to Use Config

The cloud function needs to read from Firebase config instead of `process.env`. Update `functions/src/index.ts`:

```typescript
// Get config
const config = functions.config();
const resend = new Resend(config.resend.api_key);

// In sendInvitationEmail function:
const appUrl = config.app.url;
// ...
from: config.email.from,
```

## Step 5: Deploy Functions

```bash
# Build the functions
cd functions
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

Or from the project root:
```bash
firebase deploy --only functions
```

## Step 6: Test the Email Flow

1. **Create a test bucket** in your app
2. **Add a participant** using the "Add Person" feature
3. **Check your email** (or the invited person's email)
4. **Verify the email contains:**
   - Correct bucket name
   - Working invitation link
   - Proper formatting

## Local Development

For testing locally with Firebase emulators:

1. **Create `.env` file** in `functions/` directory:
   ```bash
   cd functions
   cp .env.example .env
   ```

2. **Edit `.env`** with your values:
   ```
   RESEND_API_KEY=re_your_api_key
   FROM_EMAIL=SplitThis <onboarding@resend.dev>
   APP_URL=http://localhost:5173
   ```

3. **Update `functions/src/index.ts`** to use `.env` in development:
   ```typescript
   import * as dotenv from 'dotenv';
   if (process.env.FUNCTIONS_EMULATOR) {
     dotenv.config();
   }
   ```

4. **Start emulators:**
   ```bash
   firebase emulators:start
   ```

## Monitoring

**View function logs:**
```bash
firebase functions:log
```

**View logs for specific function:**
```bash
firebase functions:log --only sendInvitationEmail
```

**Monitor in Firebase Console:**
- Go to Firebase Console → Functions
- Click on `sendInvitationEmail`
- View logs, metrics, and health

## Troubleshooting

### Emails not sending?

1. **Check function logs:**
   ```bash
   firebase functions:log
   ```

2. **Verify Resend API key:**
   ```bash
   firebase functions:config:get
   ```

3. **Check Resend dashboard:**
   - Go to https://resend.com/emails
   - Look for failed sends and error messages

4. **Verify email address:**
   - Make sure FROM_EMAIL domain is verified in Resend
   - For testing, use `onboarding@resend.dev`

### Functions won't deploy?

1. **Check Firebase plan:**
   - Must be on Blaze (pay-as-you-go) plan

2. **Check Node.js version:**
   - Functions use Node.js 18
   - Specified in `firebase.json`

3. **Build errors:**
   ```bash
   cd functions
   npm run build
   ```

### Rate Limits

Resend free tier limits:
- 100 emails per day
- 3,000 emails per month

If you exceed these, either:
- Upgrade your Resend plan
- Switch to a different email provider

## Alternative Email Providers

If you prefer a different email service, you can modify `functions/src/index.ts` to use:

- **SendGrid**: Popular choice with good free tier
- **Mailgun**: Another reliable option
- **Amazon SES**: Very cheap for high volume
- **Postmark**: Great deliverability

## Security Notes

- ✅ API keys are stored in Firebase config (not in code)
- ✅ Functions run in secure Firebase environment
- ✅ Email addresses are validated before sending
- ✅ Invitation links expire after 7 days
- ✅ Only pending invitations trigger emails

## Cost Estimates

**Firebase Functions (Blaze Plan):**
- First 2,000,000 invocations/month: Free
- First 400,000 GB-seconds/month: Free
- First 200,000 CPU-seconds/month: Free

**Resend (Free Tier):**
- 100 emails/day: Free
- 3,000 emails/month: Free

**For typical usage (< 100 invitations/day), costs will be $0/month.**

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Firebase function logs
3. Check Resend dashboard for email delivery status
4. Consult Firebase Functions documentation
