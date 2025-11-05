import React, { useState } from 'react';
import Card from '../common/Card';
import Loading from '../common/Loading';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import './CreditCards.css';

const CreditCards = ({ creditData, loading }) => {
  const [timeWindow, setTimeWindow] = useState('short_term'); // 'short_term' (30d) or 'long_term' (180d)

  if (loading) {
    return (
      <Card>
        <Loading message="Loading credit cards..." />
      </Card>
    );
  }

  // Extract credit cards from credit data based on selected time window
  const creditCards = timeWindow === 'short_term' 
    ? (creditData?.short_term?.cards || creditData?.cards || [])
    : (creditData?.long_term?.cards || creditData?.cards || []);
  
  const hasShortTerm = creditData?.short_term?.cards && creditData.short_term.cards.length > 0;
  const hasLongTerm = creditData?.long_term?.cards && creditData.long_term.cards.length > 0;

  if (!creditCards || creditCards.length === 0) {
    return (
      <Card>
        <h3 className="credit-cards-title">💳 Credit Cards</h3>
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          No credit cards found.
        </p>
      </Card>
    );
  }

  // Helper function to get utilization color class
  const getUtilizationClass = (utilizationPercentage) => {
    if (utilizationPercentage >= 80) return 'utilization-high';
    if (utilizationPercentage >= 50) return 'utilization-medium';
    if (utilizationPercentage >= 30) return 'utilization-low';
    return 'utilization-excellent';
  };

  // Helper function to get utilization status text
  const getUtilizationStatus = (utilizationPercentage) => {
    if (utilizationPercentage >= 80) return 'High Risk';
    if (utilizationPercentage >= 50) return 'Moderate Risk';
    if (utilizationPercentage >= 30) return 'Low Risk';
    return 'Excellent';
  };

  return (
    <Card className="credit-cards-card">
      <div className="credit-cards-header">
        <h3 className="credit-cards-title">💳 Credit Cards</h3>
        {(hasShortTerm || hasLongTerm) && (
          <div className="time-window-selector">
            <button
              className={`time-window-btn ${timeWindow === 'short_term' ? 'active' : ''}`}
              onClick={() => setTimeWindow('short_term')}
              disabled={!hasShortTerm}
              title="30-day view"
            >
              30 Days
            </button>
            <button
              className={`time-window-btn ${timeWindow === 'long_term' ? 'active' : ''}`}
              onClick={() => setTimeWindow('long_term')}
              disabled={!hasLongTerm}
              title="180-day view"
            >
              180 Days
            </button>
          </div>
        )}
      </div>
      <div className="credit-cards-list">
        {creditCards.map((card, index) => {
          // utilization_percentage is already in 0-100 range (e.g., 74.7 for 74.7%)
          // utilization is a decimal (e.g., 0.747 for 74.7%)
          const utilizationPercentage = card.utilization_percentage !== undefined 
            ? card.utilization_percentage 
            : (card.utilization !== undefined ? card.utilization * 100 : 0);
          
          const balance = card.balance || 0;
          const limit = card.limit || 0;
          const availableCredit = limit - balance;

          return (
            <div key={card.account_id || index} className="credit-card-item">
              <div className="credit-card-header">
                <div className="credit-card-name">
                  <strong>{card.account_name || 'Credit Card'}</strong>
                  {card.is_overdue && (
                    <span className="credit-card-badge overdue">⚠️ Overdue</span>
                  )}
                  {card.has_interest_charges && (
                    <span className="credit-card-badge interest">💸 Interest</span>
                  )}
                  {card.is_minimum_payment_only && (
                    <span className="credit-card-badge minimum">📉 Min Payment</span>
                  )}
                </div>
                <div className={`credit-card-utilization ${getUtilizationClass(utilizationPercentage)}`}>
                  <span className="utilization-percentage">
                    {formatPercentage(utilizationPercentage)}
                  </span>
                  <span className="utilization-status">
                    {getUtilizationStatus(utilizationPercentage)}
                  </span>
                </div>
              </div>

              <div className="credit-card-details">
                <div className="credit-card-row">
                  <span className="credit-card-label">Balance:</span>
                  <span className="credit-card-value">{formatCurrency(balance)}</span>
                </div>
                <div className="credit-card-row">
                  <span className="credit-card-label">Credit Limit:</span>
                  <span className="credit-card-value">{formatCurrency(limit)}</span>
                </div>
                <div className="credit-card-row">
                  <span className="credit-card-label">Available Credit:</span>
                  <span className={`credit-card-value ${availableCredit >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(availableCredit)}
                  </span>
                </div>
                {card.apr_percentage && (
                  <div className="credit-card-row">
                    <span className="credit-card-label">APR:</span>
                    <span className="credit-card-value">{formatPercentage(card.apr_percentage / 100)}</span>
                  </div>
                )}
                {card.minimum_payment && (
                  <div className="credit-card-row">
                    <span className="credit-card-label">Minimum Payment:</span>
                    <span className="credit-card-value">{formatCurrency(card.minimum_payment)}</span>
                  </div>
                )}
                {card.total_interest_charges && card.total_interest_charges > 0 && (
                  <div className="credit-card-row">
                    <span className="credit-card-label">Interest Charges (30d):</span>
                    <span className="credit-card-value negative">
                      {formatCurrency(card.total_interest_charges)}
                    </span>
                  </div>
                )}
              </div>

              {/* Utilization Progress Bar */}
              <div className="credit-card-utilization-bar">
                <div 
                  className={`utilization-bar-fill ${getUtilizationClass(utilizationPercentage)}`}
                  style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {creditCards.length > 1 && (
        <div className="credit-cards-summary">
          <h4>Summary</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total Balance:</span>
              <span className="summary-value">
                {formatCurrency(creditCards.reduce((sum, card) => sum + (card.balance || 0), 0))}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Credit Limit:</span>
              <span className="summary-value">
                {formatCurrency(creditCards.reduce((sum, card) => sum + (card.limit || 0), 0))}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Available:</span>
              <span className="summary-value">
                {formatCurrency(
                  creditCards.reduce((sum, card) => {
                    const limit = card.limit || 0;
                    const balance = card.balance || 0;
                    return sum + (limit - balance);
                  }, 0)
                )}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Overall Utilization:</span>
              <span className="summary-value">
                {(() => {
                  const totalBalance = creditCards.reduce((sum, card) => sum + (card.balance || 0), 0);
                  const totalLimit = creditCards.reduce((sum, card) => sum + (card.limit || 0), 0);
                  const overallUtil = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
                  return formatPercentage(overallUtil);
                })()}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CreditCards;

