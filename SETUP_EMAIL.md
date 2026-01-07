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

2. **Email Service** (choose one):
   - **Gmail** (100% FREE - Recommended for getting started)
   - **SendGrid** (FREE tier: 100 emails/day)
   - **Any SMTP server** you already have

## Step 1: Set Up Email Service

### Option A: Using Gmail (Free & Easy) ⭐ RECOMMENDED

1. **Create or use an existing Gmail account**
   - Use your personal Gmail or create a new one for the app

2. **Enable 2-Step Verification:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification (required for App Passwords)

3. **Create an App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" → Enter "SplitThis"
   - Click "Generate"
   - **Copy the 16-character password** (you'll use this as `SMTP_PASS`)

### Option B: Using SendGrid (Free Tier)

1. **Create SendGrid account** at https://sendgrid.com
2. **Create API key** in Settings → API Keys
3. **Use these settings:**
   - SMTP Host: `smtp.sendgrid.net`
   - SMTP Port: `587`
   - SMTP User: `apikey` (literally the word "apikey")
   - SMTP Pass: Your SendGrid API key

### Option C: Your Own SMTP Server

If you have an existing email service, use its SMTP settings.

## Step 2: Install Functions Dependencies

```bash
cd functions
npm install
```

## Step 3: Configure Environment Variables

### For Gmail:

```bash
# Set SMTP settings
firebase functions:config:set smtp.host="smtp.gmail.com"
firebase functions:config:set smtp.port="587"
firebase functions:config:set smtp.secure="false"
firebase functions:config:set smtp.user="your-email@gmail.com"
firebase functions:config:set smtp.pass="your-16-char-app-password"

# Set the "from" email address (use your Gmail)
firebase functions:config:set email.from="SplitThis <your-email@gmail.com>"

# Set your app URL
firebase functions:config:set app.url="https://your-app-url.web.app"
```

### For SendGrid:

```bash
firebase functions:config:set smtp.host="smtp.sendgrid.net"
firebase functions:config:set smtp.port="587"
firebase functions:config:set smtp.secure="false"
firebase functions:config:set smtp.user="apikey"
firebase functions:config:set smtp.pass="YOUR_SENDGRID_API_KEY"
firebase functions:config:set email.from="SplitThis <your-verified-email@yourdomain.com>"
firebase functions:config:set app.url="https://your-app-url.web.app"
```

**Verify your config:**
```bash
firebase functions:config:get
```

## Step 4: Deploy Functions

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

## Step 5: Test the Email Flow

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
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FROM_EMAIL=SplitThis <your-email@gmail.com>
   APP_URL=http://localhost:5173
   ```

3. **Start emulators:**
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

2. **Verify SMTP configuration:**
   ```bash
   firebase functions:config:get
   ```

3. **For Gmail:**
   - Make sure 2-Step Verification is enabled
   - Use App Password, not your regular password
   - Check if "Less secure app access" is blocking you
   - Verify FROM_EMAIL matches your SMTP_USER

4. **For SendGrid:**
   - Verify your API key is correct
   - Make sure sender email is verified in SendGrid
   - Check SendGrid activity dashboard for errors

5. **Test SMTP connection:**
   - Try sending a test email from your local machine first
   - Use the Firebase emulators to test before deploying

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

**Gmail:**
- Free tier: ~500 emails/day
- More than enough for typical usage

**SendGrid:**
- Free tier: 100 emails/day
- Upgrade if you need more

If you exceed these limits, consider:
- Upgrading your email service plan
- Using a dedicated email service provider
- Setting up your own SMTP server

## Supported Email Providers

The current implementation uses Nodemailer and works with any SMTP provider:

- **Gmail** ⭐ Recommended for personal projects
- **SendGrid** - Good for higher volume
- **Mailgun** - Another reliable option
- **Amazon SES** - Very cheap for high volume
- **Postmark** - Great deliverability
- **Any SMTP server** - Just configure the settings

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

**Email Service:**
- **Gmail**: 100% FREE (up to ~500 emails/day)
- **SendGrid**: FREE tier (100 emails/day)

**For typical usage (< 100 invitations/day), costs will be $0/month.**

This solution requires NO additional paid services!

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Firebase function logs
3. Check Resend dashboard for email delivery status
4. Consult Firebase Functions documentation
