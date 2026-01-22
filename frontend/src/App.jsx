import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';

// Components
import Login from './components/shared/Login';
import RideRegistration from './components/employee/RideRegistration';
import MonthOverview from './components/employee/MonthOverview';
import ConfigManagement from './components/hr/ConfigManagement';

function Navbar() {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">🚴 Fietsvergoeding</h1>
            <div className="flex space-x-4">
              <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded-md transition">
                Register Ride
              </Link>
              <Link to="/overview" className="hover:bg-blue-700 px-3 py-2 rounded-md transition">
                Overview
              </Link>
              {user.email.includes('hr') || user.email.includes('admin') ? (
                <Link to="/hr/config" className="hover:bg-blue-700 px-3 py-2 rounded-md transition">
                  HR Config
                </Link>
              ) : null}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {user.name} ({user.land})
            </span>
            <button
              onClick={logout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
}

function AppContent() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RideRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overview"
            element={
              <ProtectedRoute>
                <MonthOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/config"
            element={
              <ProtectedRoute>
                <ConfigManagement />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;