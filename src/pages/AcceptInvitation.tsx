import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getInvitationByToken, acceptInvitation } from '../utils/invitations';
import type { Invitation } from '../types';

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { currentUser, login, register } = useAuth();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  // Form state for login/register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Load invitation data - only if user is authenticated
  useEffect(() => {
    async function loadInvitation() {
      console.log('=== AcceptInvitation v2.0 - Authentication Check ===');
      console.log('Token:', token);
      console.log('Current User:', currentUser?.uid || 'NOT LOGGED IN');

      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      // If user is not logged in, show login/signup form
      // Don't try to load invitation yet (Firestore rules require auth)
      if (!currentUser) {
        console.log('User not authenticated - showing login form');
        setLoading(false);
        return;
      }

      try {
        console.log('User authenticated - loading invitation...');
        const invitationData = await getInvitationByToken(token);

        if (!invitationData) {
          setError('This invitation is invalid or has expired');
          setLoading(false);
          return;
        }

        setInvitation(invitationData.data);
        setEmail(invitationData.data.email);
        setLoading(false);

        // User is logged in, try to accept immediately
        await handleAccept(invitationData.data, invitationData.id);
      } catch (err) {
        console.error('Error loading invitation:', err);
        setError('Failed to load invitation');
        setLoading(false);
      }
    }

    loadInvitation();
  }, [token, currentUser]);

  async function handleAccept(inv: Invitation, invId: string) {
    if (!currentUser) return;

    setAccepting(true);
    setError('');

    try {
      console.log('Accepting invitation:', { invId, bucketId: inv.bucketId, userUid: currentUser.uid });
      await acceptInvitation(
        invId,
        currentUser.uid,
        currentUser.email || '',
        currentUser.displayName || undefined
      );

      console.log('Invitation accepted successfully');
      // Redirect to the bucket
      navigate(`/buckets/${inv.bucketId}`);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      console.error('Error code:', err.code);
      console.error('Error details:', err);
      setError(`Failed to accept invitation: ${err.message || err.code || 'Unknown error'}`);
      setAccepting(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();

    setError('');
    setAccepting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
        // Note: displayName could be set via updateProfile if needed
      }
      // After successful auth, the useEffect will trigger invitation loading and acceptance
    } catch (err: any) {
      console.error('Error during authentication:', err);
      setError(err.message || 'Authentication failed');
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Invalid Invitation</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (accepting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Accepting invitation...</p>
        </div>
      </div>
    );
  }

  // If user is logged in but we haven't accepted yet (error occurred)
  if (currentUser && invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accept Invitation</h2>
            <p className="text-gray-600 mb-2">
              You've been invited to join:
            </p>
            <p className="text-xl font-semibold text-blue-600 mb-4">{invitation.bucketName}</p>
            <p className="text-sm text-gray-500 mb-6">
              Invited by: {invitation.invitedByEmail}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={() => handleAccept(invitation, invitation.id)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Accept Invitation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User not logged in - show login/register form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Invited!</h2>
          <p className="text-gray-600">
            You've been invited to join an expense bucket on SplitThis.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please log in or sign up to accept the invitation.
          </p>
        </div>

        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-center font-medium transition-colors ${
                isLogin
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-center font-medium transition-colors ${
                !isLogin
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={accepting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLogin ? 'Login & Accept' : 'Sign Up & Accept'}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          By accepting, you'll be added to the expense bucket and can start tracking expenses together.
        </p>
      </div>
    </div>
  );
}
