import React from 'react';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';
import './CreditCards.css';

const CreditCards = ({ accounts, loading }) => {
  if (loading) {
    return (
      <Card>
        <p>Loading credit cards...</p>
      </Card>
    );
  }

  if (!accounts || !accounts.credit_cards || !accounts.credit_cards.cards || accounts.credit_cards.cards.length === 0) {
    return (
      <Card>
        <p>No credit cards found.</p>
      </Card>
    );
  }

  const { cards, total_balance, total_limit, total_available, overall_utilization } = accounts.credit_cards;

  const getUtilizationColor = (rate) => {
    const rateNum = parseFloat(rate);
    if (rateNum >= 80) return 'high';
    if (rateNum >= 50) return 'medium';
    return 'low';
  };

  return (
    <Card className="credit-cards-card">
      <h3 className="credit-cards-title">💳 Credit Cards</h3>
      
      {/* Summary */}
      <div className="credit-summary">
        <div className="summary-item">
          <div className="summary-label">Total Balance</div>
          <div className="summary-value">{formatCurrency(total_balance)}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Total Limit</div>
          <div className="summary-value">{formatCurrency(total_limit)}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Available Credit</div>
          <div className={`summary-value ${getUtilizationColor(overall_utilization)}`}>
            {formatCurrency(total_available)}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Utilization</div>
          <div className={`summary-value utilization ${getUtilizationColor(overall_utilization)}`}>
            {overall_utilization}%
          </div>
        </div>
      </div>

      {/* Individual Cards */}
      <div className="credit-cards-list">
        {cards.map((card, index) => (
          <div key={card.account_id || index} className="credit-card-item">
            <div className="card-header">
              <div className="card-info">
                <span className="card-type">{card.subtype || 'Credit Card'}</span>
                <span className="card-id">{card.account_id?.substring(0, 8)}...</span>
              </div>
              <div className={`card-utilization-badge ${getUtilizationColor(card.utilization_rate)}`}>
                {card.utilization_rate}%
              </div>
            </div>
            <div className="card-details">
              <div className="card-detail-item">
                <span className="card-detail-label">Balance:</span>
                <span className="card-detail-value">{formatCurrency(card.current_balance)}</span>
              </div>
              <div className="card-detail-item">
                <span className="card-detail-label">Limit:</span>
                <span className="card-detail-value">{formatCurrency(card.credit_limit)}</span>
              </div>
              <div className="card-detail-item">
                <span className="card-detail-label">Available:</span>
                <span className={`card-detail-value ${getUtilizationColor(card.utilization_rate)}`}>
                  {formatCurrency(card.available_credit)}
                </span>
              </div>
            </div>
            <div className="card-utilization-bar">
              <div 
                className={`card-utilization-fill ${getUtilizationColor(card.utilization_rate)}`}
                style={{ width: `${Math.min(parseFloat(card.utilization_rate), 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CreditCards;
