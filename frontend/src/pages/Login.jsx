import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers } from '../services/api';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import '../styles/Login.css';

const Login = () => {
  const [role, setRole] = useState('customer');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUsers();
      console.log('Login - getUsers response:', response);
      
      // Backend returns { success: true, users: [...] }
      // API interceptor returns response.data, so response is already the data object
      let usersArray = [];
      if (Array.isArray(response)) {
        usersArray = response;
      } else if (response?.users && Array.isArray(response.users)) {
        usersArray = response.users;
      } else if (response?.data?.users && Array.isArray(response.data.users)) {
        usersArray = response.data.users;
      } else if (response?.data && Array.isArray(response.data)) {
        usersArray = response.data;
      }
      
      console.log('Login - extracted users array:', usersArray);
      setUsers(usersArray);
      
      if (usersArray.length === 0) {
        setError('No users found. Please ensure the database has been populated.');
      }
    } catch (err) {
      console.error('Login - Error loading users:', err);
      setError(err.message || 'Failed to load users');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (role === 'customer' && (!selectedUserId || selectedUserId === '')) {
      setError('Please select a user');
      return;
    }

    const userId = role === 'customer' ? parseInt(selectedUserId, 10) : null;
    console.log('Login - Submitting with role:', role, 'userId:', userId);
    
    if (role === 'customer' && (isNaN(userId) || userId <= 0)) {
      setError('Invalid user selected');
      return;
    }

    login(role, userId);
    
    // Navigate based on role
    if (role === 'customer') {
      navigate('/dashboard');
    } else {
      navigate('/operator');
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
                    setSelectedUserId('');
                  }}
                >
                  Customer
                </button>
                <button
                  type="button"
                  className={`role-button ${role === 'operator' ? 'active' : ''}`}
                  onClick={() => {
                    setRole('operator');
                    setSelectedUserId('');
                  }}
                >
                  Operator
                </button>
              </div>
            </div>

            {role === 'customer' && (
              <div className="form-group">
                <label htmlFor="userId">Select User</label>
                {loading ? (
                  <Loading size="small" message="Loading users..." />
                ) : (
                  <select
                    id="userId"
                    value={selectedUserId}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log('User selected:', value);
                      setSelectedUserId(value);
                      setError(null); // Clear any previous errors
                    }}
                    className="form-select"
                    required
                  >
                    <option value="">-- Select a user --</option>
                    {users.length === 0 ? (
                      <option value="" disabled>No users available</option>
                    ) : (
                      users.map((user) => {
                        const userId = user.id || user.user_id;
                        const userName = user.name || 'Unknown';
                        return (
                          <option key={userId} value={userId}>
                            {userName} (ID: {userId})
                          </option>
                        );
                      })
                    )}
                  </select>
                )}
              </div>
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
                disabled={loading || (role === 'customer' && !selectedUserId)}
              >
                Continue
              </Button>
            </div>

            <div className="login-info">
              <p className="info-text">
                <strong>Demo Mode:</strong> No password required. Select your role and user to continue.
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;

