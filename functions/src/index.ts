import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// Get configuration from Firebase config or environment variables (for local dev)
const getConfig = () => {
  const config = functions.config();

  return {
    smtpHost: config.smtp?.host || process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(config.smtp?.port || process.env.SMTP_PORT || '587'),
    smtpSecure: (config.smtp?.secure || process.env.SMTP_SECURE) === 'true',
    smtpUser: config.smtp?.user || process.env.SMTP_USER,
    smtpPass: config.smtp?.pass || process.env.SMTP_PASS,
    fromEmail: config.email?.from || process.env.FROM_EMAIL || 'SplitThis <noreply@splitthis.app>',
    appUrl: config.app?.url || process.env.APP_URL || 'https://splitthis.app',
  };
};

// Create email transporter
const createTransporter = () => {
  const config = getConfig();

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure, // true for 465, false for other ports
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
};

interface Invitation {
  id: string;
  bucketId: string;
  bucketName: string;
  email: string;
  invitedBy: string;
  invitedByEmail: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
}

/**
 * Sends an email notification when a new invitation is created
 * Triggered on invitation document creation in Firestore
 */
export const sendInvitationEmail = functions.firestore
  .document('invitations/{invitationId}')
  .onCreate(async (snap, context) => {
    try {
      const invitation = snap.data() as Invitation;
      const config = getConfig();
      const transporter = createTransporter();

      // Only send email for pending invitations
      if (invitation.status !== 'pending') {
        console.log('Skipping email - invitation status is not pending');
        return null;
      }

      // Generate the invitation link
      const invitationLink = `${config.appUrl}/invite/${invitation.token}`;

      // Get the inviter's name
      let inviterName = invitation.invitedByEmail;
      try {
        const inviterDoc = await admin.firestore()
          .collection('users')
          .doc(invitation.invitedBy)
          .get();

        if (inviterDoc.exists) {
          const inviterData = inviterDoc.data();
          inviterName = inviterData?.displayName || inviterData?.email || invitation.invitedByEmail;
        }
      } catch (error) {
        console.warn('Could not fetch inviter details:', error);
      }

      // Prepare email content
      const subject = `You've been added to the expenses bucket "${invitation.bucketName}"`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You've been added to an expense bucket</h2>
          <p>Hi!</p>
          <p>${inviterName} has added you to the expenses bucket <strong>"${invitation.bucketName}"</strong> on SplitThis.</p>
          <p>Access the bucket at:</p>
          <p style="margin: 20px 0;">
            <a href="${invitationLink}"
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Bucket
            </a>
          </p>
          <p>Or copy this link:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${invitationLink}
          </p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            SplitThis makes it easy to split expenses and track who owes what.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you don't have an account yet, you'll be able to create one when you accept the invitation.
          </p>
          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            This invitation will expire in 7 days.
          </p>
        </div>
      `;

      const textBody = `You've been added to the expenses bucket "${invitation.bucketName}". Access the bucket at ${invitationLink}

${inviterName} has added you to the expenses bucket "${invitation.bucketName}" on SplitThis.

Click the link above to access the bucket and start tracking expenses together.

SplitThis makes it easy to split expenses and track who owes what.

If you don't have an account yet, you'll be able to create one when you accept the invitation.

This invitation will expire in 7 days.`;

      // Send email using Nodemailer
      const info = await transporter.sendMail({
        from: config.fromEmail,
        to: invitation.email,
        subject: subject,
        html: htmlBody,
        text: textBody,
      });

      console.log('Email sent successfully:', info.messageId);

      // Update the invitation document with email sent status (optional)
      await snap.ref.update({
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error in sendInvitationEmail function:', error);
      // Don't throw - we don't want to fail the invitation creation if email fails
      return { success: false, error: String(error) };
    }
  });
