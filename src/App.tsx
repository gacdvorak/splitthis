import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Buckets from './pages/Buckets';
import BucketDetail from './pages/BucketDetail';
import AcceptInvitation from './pages/AcceptInvitation';
import VerifyEmail from './pages/VerifyEmail';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!currentUser.emailVerified) {
    return <Navigate to="/verify-email" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />
      <Route
        path="/invite/:token"
        element={<AcceptInvitation />}
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Buckets />
          </PrivateRoute>
        }
      />
      <Route
        path="/bucket/:bucketId"
        element={
          <PrivateRoute>
            <BucketDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/buckets/:bucketId"
        element={
          <PrivateRoute>
            <BucketDetail />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
