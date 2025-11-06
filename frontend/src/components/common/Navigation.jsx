import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConsent } from '../../hooks/useConsent';
import { useAIConsent } from '../../hooks/useAIConsent';
import { UserContext } from '../../context/UserContext';
import Button from './Button';
import './Navigation.css';

const Navigation = () => {
  const { isAuthenticated, isCustomer, isOperator, logout, userId } = useAuth();
  const { hasConsent, grant, revoke, loadConsent } = useConsent(userId);
  const { hasAIConsent: hasAIConsentGranted, grant: grantAI, revoke: revokeAI, loadAIConsent, loading: loadingAIConsent } = useAIConsent(userId);
  // Safely access UserContext - it may not be available if Navigation is outside UserProvider
  const userContext = useContext(UserContext);
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loadingConsent, setLoadingConsent] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (userId && isCustomer()) {
      loadConsent();
      loadAIConsent();
    }
  }, [userId, isCustomer, loadConsent, loadAIConsent]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleConsentToggle = async () => {
    setLoadingConsent(true);
    try {
      let newConsentStatus = null;
      if (hasConsent) {
        await revoke();
        newConsentStatus = 'revoked';
      } else {
        const success = await grant();
        newConsentStatus = success ? 'granted' : 'revoked';
        if (success && userContext?.refreshProfile) {
          // Only refresh profile if UserProvider is available
          await userContext.refreshProfile();
        }
      }
      // Notify both dashboards about consent change
      window.dispatchEvent(new CustomEvent('consent-changed', { 
        detail: { hasConsent: newConsentStatus === 'granted' } 
      }));
      // Also trigger dashboard refresh for user dashboard
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      // Trigger operator dashboard refresh to update user consent status
      window.dispatchEvent(new CustomEvent('refreshOperatorData'));
    } catch (error) {
      // Error already handled by consent hook
    } finally {
      setLoadingConsent(false);
    }
  };

  const handleAIConsentToggle = async () => {
    try {
      if (hasAIConsentGranted) {
        await revokeAI();
      } else {
        await grantAI();
      }
      // Notify dashboards about AI consent change
      window.dispatchEvent(new CustomEvent('ai-consent-changed', { 
        detail: { hasAIConsent: !hasAIConsentGranted } 
      }));
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    } catch (error) {
      // Error already handled by AI consent hook
    }
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

          {/* Refresh Button */}
          <button
            className="nav-refresh-button"
            onClick={() => {
              if (isCustomer()) {
                window.dispatchEvent(new CustomEvent('dashboard-refresh'));
              } else if (isOperator()) {
                window.dispatchEvent(new CustomEvent('refreshOperatorData'));
              }
            }}
            title="Refresh data"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1 4V10H7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23 20V14H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Profile Menu - For customers and operators */}
          {(isCustomer() || isOperator()) && (
            <div className="nav-profile-menu" ref={menuRef}>
              <button
                className="nav-profile-button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="Profile menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="nav-profile-dropdown">
                  <button
                    className="nav-profile-dropdown-item"
                    onClick={() => {
                      setShowProfileMenu(false);
                      // Profile section placeholder - no implementation needed
                    }}
                  >
                    Profile
                  </button>

                  {/* Data Processing Consent - Only for customers */}
                  {isCustomer() && (
                    <>
                      <div className="nav-profile-dropdown-item nav-profile-consent">
                        <span className="nav-profile-consent-label">Data Processing Consent</span>
                        <label className="nav-profile-consent-toggle">
                          <input
                            type="checkbox"
                            checked={hasConsent}
                            onChange={handleConsentToggle}
                            disabled={loadingConsent}
                            className="nav-profile-consent-input"
                          />
                          <span className={`nav-profile-consent-slider ${hasConsent ? 'active' : ''}`}>
                            <span className="nav-profile-consent-label-text">
                              {hasConsent ? 'ON' : 'OFF'}
                            </span>
                          </span>
                        </label>
                        {loadingConsent && (
                          <span className="nav-profile-consent-loading">Updating...</span>
                        )}
                      </div>
                      {/* AI Consent - Only for customers, below data processing consent */}
                      <div className="nav-profile-dropdown-item nav-profile-consent">
                        <span className="nav-profile-consent-label">AI Features Consent</span>
                        <label className="nav-profile-consent-toggle">
                          <input
                            type="checkbox"
                            checked={hasAIConsentGranted}
                            onChange={handleAIConsentToggle}
                            disabled={loadingAIConsent}
                            className="nav-profile-consent-input"
                          />
                          <span className={`nav-profile-consent-slider ${hasAIConsentGranted ? 'active' : ''}`}>
                            <span className="nav-profile-consent-label-text">
                              {hasAIConsentGranted ? 'ON' : 'OFF'}
                            </span>
                          </span>
                        </label>
                        {loadingAIConsent && (
                          <span className="nav-profile-consent-loading">Updating...</span>
                        )}
                      </div>
                      <div className="nav-profile-dropdown-divider"></div>
                    </>
                  )}

                  <button
                    className="nav-profile-dropdown-item nav-profile-logout"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

