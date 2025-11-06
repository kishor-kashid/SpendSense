import React from 'react';
import Card from '../common/Card';
import Loading from '../common/Loading';
import './SubscriptionSuggestions.css';

const SubscriptionSuggestions = ({ suggestions, loading, onRefresh }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return <Loading message="Generating subscription suggestions..." />;
  }

  if (!suggestions) {
    return (
      <Card className="subscription-suggestions-empty">
        <p>No suggestions available. Please try again later.</p>
        {onRefresh && (
          <button onClick={onRefresh} className="retry-button">
            Refresh
          </button>
        )}
      </Card>
    );
  }

  const suggestionList = suggestions.suggestions || [];
  const summary = suggestions.summary || {};

  return (
    <div className="subscription-suggestions">
      {summary.potential_monthly_savings > 0 && (
        <Card className="savings-summary">
          <h3>Potential Savings</h3>
          <div className="savings-stats">
            <div className="savings-stat">
              <span className="savings-label">Monthly Savings</span>
              <span className="savings-value monthly">
                {formatCurrency(summary.potential_monthly_savings || 0)}
              </span>
            </div>
            <div className="savings-stat">
              <span className="savings-label">Yearly Savings</span>
              <span className="savings-value yearly">
                {formatCurrency(summary.potential_yearly_savings || 0)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {summary.message && (
        <Card className="suggestions-message">
          <p>{summary.message}</p>
        </Card>
      )}

      {suggestionList.length > 0 ? (
        <Card className="suggestions-list">
          <h3>Subscription Cancellation Suggestions</h3>
          <div className="suggestion-items">
            {suggestionList.map((suggestion, index) => (
              <div key={index} className="suggestion-item">
                <div className="suggestion-header">
                  <h4>{suggestion.merchant_name}</h4>
                  <div className="suggestion-priority">
                    <span className={`priority-badge priority-${suggestion.priority || 'medium'}`}>
                      {suggestion.priority || 'medium'}
                    </span>
                  </div>
                </div>
                <div className="suggestion-details">
                  <div className="suggestion-cost">
                    <span className="cost-label">Monthly Cost:</span>
                    <span className="cost-value">
                      {formatCurrency(suggestion.potential_savings?.monthly || suggestion.monthly_cost || 0)}
                    </span>
                  </div>
                  {suggestion.potential_savings?.yearly && (
                    <div className="suggestion-savings">
                      <span className="savings-label">Yearly Savings:</span>
                      <span className="savings-value">
                        {formatCurrency(suggestion.potential_savings.yearly)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="suggestion-rationale">
                  <p>{suggestion.rationale || 'No rationale provided'}</p>
                </div>
                {suggestion.potential_alternatives && (
                  <div className="suggestion-alternatives">
                    <strong>Alternatives:</strong> {suggestion.potential_alternatives}
                  </div>
                )}
                {suggestion.analysis && (
                  <div className="suggestion-analysis">
                    <details>
                      <summary>Usage Analysis</summary>
                      <div className="analysis-details">
                        <p>Usage Frequency: {suggestion.analysis.usageFrequency?.toFixed(1) || 'N/A'} times/month</p>
                        <p>Cost per Use: {formatCurrency(suggestion.analysis.costPerUse || 0)}</p>
                        <p>Value Score: {(suggestion.analysis.valueScore * 100).toFixed(0)}%</p>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="no-suggestions">
          <h3>No Cancellation Suggestions</h3>
          <p>
            {summary.message || 
              'All your subscriptions appear to be actively used and provide value. Consider reviewing them periodically to ensure they still meet your needs.'}
          </p>
        </Card>
      )}

      {suggestions.ai_rationale && (
        <Card className="ai-rationale">
          <h3>Analysis Summary</h3>
          <p>{suggestions.ai_rationale}</p>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionSuggestions;

