import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import DemoBanner from './components/common/DemoBanner';
import Navigation from './components/common/Navigation';
import Login from './pages/Login';
import UserPortal from './pages/UserPortal';
import OperatorPortal from './pages/OperatorPortal';
import NotFound from './pages/NotFound';
import './styles/globals.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <DemoBanner />
          <Navigation />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireRole="customer">
                  <UserProvider>
                    <UserPortal />
                  </UserProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/operator"
              element={
                <ProtectedRoute requireRole="operator">
                  <OperatorPortal />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

