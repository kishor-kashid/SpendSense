import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import './Navigation.css';

const Navigation = () => {
  const { isAuthenticated, isCustomer, isOperator, logout, userId } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <nav className="navigation">
      <div className="navigation-content">
        <div className="navigation-brand">
          <Link to={isCustomer() ? '/dashboard' : '/operator'}>
            <strong>SpendSense</strong>
          </Link>
        </div>

        <div className="navigation-links">
          {isCustomer() && (
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
          )}

          {isOperator() && (
            <Link to="/operator" className="nav-link">
              Operator Dashboard
            </Link>
          )}

          {userId && (
            <span className="nav-user-info">
              User ID: {userId}
            </span>
          )}

          <Button
            variant="outline"
            size="small"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

