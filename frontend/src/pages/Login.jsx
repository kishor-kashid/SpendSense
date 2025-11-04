import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import '../styles/Login.css';

const Login = () => {
  const [role, setRole] = useState('customer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs for both roles
      if (!username.trim()) {
        setError('Please enter your username');
        setLoading(false);
        return;
      }
      if (!password.trim()) {
        setError('Please enter your password');
        setLoading(false);
        return;
      }

      // Call login API
      const response = await apiLogin(username, password, role);
      
      if (response.success && response.user) {
        // Store user info and login
        const userId = response.user.id;
        login(role, userId, response.user);
        
        // Navigate based on role
        if (role === 'customer') {
          navigate('/dashboard');
        } else {
          navigate('/operator');
        }
      } else {
        setError(response.error?.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card-wrapper">
        <Card title="Welcome to SpendSense" className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="role">Select Role</label>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-button ${role === 'customer' ? 'active' : ''}`}
                  onClick={() => {
                    setRole('customer');
                    setUsername('');
                    setPassword('');
                  }}
                >
                  Customer
                </button>
                <button
                  type="button"
                  className={`role-button ${role === 'operator' ? 'active' : ''}`}
                  onClick={() => {
                    setRole('operator');
                    setUsername('');
                    setPassword('');
                  }}
                >
                  Operator
                </button>
              </div>
            </div>

            {role === 'customer' && (
              <>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    className="form-input"
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="form-input"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </>
            )}

            {role === 'operator' && (
              <>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    className="form-input"
                    placeholder="Enter operator username"
                    required
                    autoComplete="username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="form-input"
                    placeholder="Enter operator password"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-actions">
              <Button 
                type="submit" 
                variant="primary" 
                fullWidth
                disabled={loading || !username.trim() || !password.trim()}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;

