# SplitThis Cloud Functions

Firebase Cloud Functions for sending automated emails when users are added to expense buckets.

## Setup

1. **Install dependencies:**
   ```bash
   cd functions
   npm install
   ```

2. **Configure environment variables:**

   You need to set up SMTP settings in Firebase. Works with **Gmail (free)**, SendGrid, or any SMTP provider.

   **For Gmail (Recommended - 100% Free):**

   First, create a Gmail App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Enable 2-Step Verification if needed
   - Create an App Password for "Mail"

   Then set the config:
   ```bash
   firebase functions:config:set smtp.host="smtp.gmail.com"
   firebase functions:config:set smtp.port="587"
   firebase functions:config:set smtp.secure="false"
   firebase functions:config:set smtp.user="your-email@gmail.com"
   firebase functions:config:set smtp.pass="your-16-char-app-password"
   firebase functions:config:set email.from="SplitThis <your-email@gmail.com>"
   firebase functions:config:set app.url="https://splitthis.app"
   ```

   **For SendGrid:**
   ```bash
   firebase functions:config:set smtp.host="smtp.sendgrid.net"
   firebase functions:config:set smtp.port="587"
   firebase functions:config:set smtp.secure="false"
   firebase functions:config:set smtp.user="apikey"
   firebase functions:config:set smtp.pass="YOUR_SENDGRID_API_KEY"
   firebase functions:config:set email.from="SplitThis <verified@yourdomain.com>"
   firebase functions:config:set app.url="https://splitthis.app"
   ```

   **Verify your config:**
   ```bash
   firebase functions:config:get
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

This project uses [Nodemailer](https://nodemailer.com/) with SMTP. Compatible with:

- **Gmail** ⭐ FREE (up to ~500 emails/day)
- **SendGrid** - FREE tier (100 emails/day)
- **Mailgun** - FREE tier available
- **Any SMTP server** - Just configure the settings

### Setting up Gmail (Recommended)

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Create an App Password for "Mail"
5. Use the 16-character password in your Firebase config

**No additional services or payments required!**

## Troubleshooting

**Functions not deploying?**
- Make sure you're on the Blaze (pay-as-you-go) plan in Firebase
- Check that Node.js 18 is available in your Firebase project

**Emails not sending?**
- For Gmail: Verify you're using an App Password (not regular password)
- For Gmail: Make sure 2-Step Verification is enabled
- Check that your FROM_EMAIL matches your SMTP_USER
- Look at function logs: `npm run logs`
- Test SMTP settings locally first

**Testing locally?**
- Use Firebase emulators: `npm run serve`
- Check the emulator logs for errors
- Make sure your .env file is properly configured
- Try sending a test email outside of Firebase first

## Cost

**100% FREE for typical usage:**
- Firebase Functions free tier: 2M invocations/month
- Gmail: Free (up to ~500 emails/day)
- SendGrid: Free tier (100 emails/day)

No paid services required!
