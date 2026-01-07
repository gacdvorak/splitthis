import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Buckets from './pages/Buckets';
import BucketDetail from './pages/BucketDetail';
import AcceptInvitation from './pages/AcceptInvitation';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
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
