import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const { currentUser, sendVerificationEmail, reloadUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // If email is already verified, redirect to home
    if (currentUser.emailVerified) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleResendEmail = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendVerificationEmail();
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await reloadUser();

      if (currentUser?.emailVerified) {
        navigate('/');
      } else {
        setMessage('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to logout');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/splitthis-logo.svg" alt="SplitThis" className="h-12 mx-auto mb-4" />
          <p className="text-dark-secondary text-body">Split expenses with ease</p>
        </div>

        <div className="card">
          <h2 className="text-display mb-4">Verify Your Email</h2>

          <p className="text-body text-dark-secondary mb-2">
            We've sent a verification email to <strong>{currentUser?.email}</strong>.
            Please check your inbox and click the verification link to continue.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-small text-yellow-800">
              <strong>📬 Can't find the email?</strong> Check your spam or junk folder.
              Verification emails sometimes get filtered there.
            </p>
          </div>

          {message && (
            <div className="bg-brand-primary/20 border border-brand-primary text-dark-primary px-4 py-3 rounded-xl mb-4">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-destructive/20 border border-destructive text-destructive px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleCheckVerification}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Please wait...' : 'I\'ve Verified My Email'}
            </button>

            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="btn-secondary w-full"
            >
              Resend Verification Email
            </button>

            <div className="text-center mt-4">
              <button
                onClick={handleLogout}
                className="text-dark-secondary hover:text-dark-primary text-body transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
