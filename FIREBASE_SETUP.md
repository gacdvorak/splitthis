# Firebase Email Configuration

## Configuring Email Verification Templates

The email verification subject line and template content are configured in the Firebase Console, not in code.

### Steps to Customize Email Verification Template:

1. **Access Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `splitthis-50c1e`

2. **Navigate to Email Templates**
   - Click on **Authentication** in the left sidebar
   - Select the **Templates** tab
   - Find **Email address verification** in the list

3. **Edit the Template**
   - Click the pencil icon (Edit) next to "Email address verification"
   - Modify the following fields:

   **Recommended Settings:**
   - **Sender name:** `SplitThis`
   - **Reply-to email:** Your support email (e.g., `support@splitthis.app`)
   - **Subject line:** `Verify your email for splitthis`
   - **Email body:** Customize as needed (keep the verification link button)

4. **Save Changes**
   - Click **Save** to apply your changes

## Improving Email Deliverability

To prevent verification emails from landing in spam folders:

### 1. Configure SPF and DKIM Records
- Add proper SPF and DKIM records for your custom domain
- This requires using a custom email domain (not the default Firebase domain)

### 2. Use a Custom Email Domain
Firebase uses `noreply@<project-id>.firebaseapp.com` by default. To improve deliverability:
- Set up a custom domain in Firebase Hosting
- Configure email authentication (SPF, DKIM, DMARC)
- Use Firebase's custom email domain feature (available in Blaze plan)

### 3. Warm Up Your Sending Domain
- Start with low volume
- Gradually increase sending volume over time
- Monitor bounce and spam complaint rates

### 4. Email Best Practices
- Use a recognizable sender name: `SplitThis`
- Include a clear subject line
- Add unsubscribe links (for marketing emails)
- Avoid spam trigger words

## Current Implementation

The app uses Firebase's default email verification:
- **Function:** `sendEmailVerification()` from `firebase/auth`
- **Location:** `src/contexts/AuthContext.tsx:43-48`
- **Redirect URL:** Configured to return to app homepage after verification

### User Experience Improvements Implemented:
- Clear instructions on verification pages
- Spam folder warning notice
- Resend email functionality
- Email verification status check

## Testing Email Delivery

1. Sign up with a test email account
2. Check both inbox and spam folder
3. Verify the email arrives and links work
4. Monitor deliverability rates over time

## Resources

- [Firebase Email Templates Documentation](https://firebase.google.com/docs/auth/custom-email-handler)
- [Email Deliverability Best Practices](https://support.google.com/mail/answer/81126)
