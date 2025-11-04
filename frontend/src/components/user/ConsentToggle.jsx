import React from 'react';
import Card from '../common/Card';
import './ConsentToggle.css';

const ConsentToggle = ({ hasConsent, onToggle, loading, disabled }) => {
  return (
    <Card className="consent-toggle-card">
      <div className="consent-toggle-content">
        <div className="consent-toggle-info">
          <h3 className="consent-toggle-title">Data Processing Consent</h3>
          <p className="consent-toggle-description">
            {hasConsent 
              ? 'You have granted consent for personalized recommendations and behavioral analysis.'
              : 'Enable consent to receive personalized recommendations and insights based on your spending patterns.'}
          </p>
        </div>
        <label className="consent-toggle-switch">
          <input
            type="checkbox"
            checked={hasConsent}
            onChange={onToggle}
            disabled={loading || disabled}
            className="consent-toggle-input"
          />
          <span className={`consent-toggle-slider ${hasConsent ? 'active' : ''}`}>
            <span className="consent-toggle-label">
              {hasConsent ? 'ON' : 'OFF'}
            </span>
          </span>
        </label>
      </div>
      {loading && (
        <div className="consent-toggle-loading">
          <span>Updating...</span>
        </div>
      )}
    </Card>
  );
};

export default ConsentToggle;

