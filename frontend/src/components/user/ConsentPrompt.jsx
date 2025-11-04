import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import './ConsentPrompt.css';

const ConsentPrompt = ({ onGrant, onDeny, loading = false }) => {
  return (
    <Card className="consent-prompt-card">
      <div className="consent-prompt-content">
        <h2 className="consent-prompt-title">Data Processing Consent</h2>
        <p className="consent-prompt-description">
          To provide personalized financial insights and recommendations, we need your consent to process your transaction data.
        </p>
        
        <div className="consent-prompt-details">
          <h3>What we'll do:</h3>
          <ul>
            <li>Analyze your transaction history to detect spending patterns</li>
            <li>Identify behavioral signals (subscriptions, savings, credit usage, income patterns)</li>
            <li>Assign you to a financial persona based on your behavior</li>
            <li>Generate personalized recommendations with clear explanations</li>
          </ul>
          
          <h3>Your rights:</h3>
          <ul>
            <li>You can revoke consent at any time</li>
            <li>All recommendations include clear rationales citing your data</li>
            <li>No recommendations will be generated without your consent</li>
          </ul>
        </div>

        <div className="consent-prompt-actions">
          <Button
            variant="primary"
            onClick={onGrant}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Processing...' : 'I Consent - Continue'}
          </Button>
          <Button
            variant="outline"
            onClick={onDeny}
            disabled={loading}
            fullWidth
          >
            Decline
          </Button>
        </div>

        <p className="consent-prompt-disclaimer">
          <strong>Note:</strong> This is educational content, not financial advice. Consult a licensed advisor for personalized guidance.
        </p>
      </div>
    </Card>
  );
};

export default ConsentPrompt;

