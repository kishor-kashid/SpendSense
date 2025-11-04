import React from 'react';
import Card from '../common/Card';
import Loading from '../common/Loading';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import './SignalViewer.css';

const SignalViewer = ({ signals, persona, loading }) => {
  if (loading) {
    return (
      <Card>
        <Loading message="Loading signals..." />
      </Card>
    );
  }

  if (!signals) {
    return (
      <Card>
        <p>No signals available for this user.</p>
      </Card>
    );
  }

  return (
    <Card title="Detected Signals" className="signal-viewer">
      {persona && (
        <div className="signal-viewer-persona">
          <h3>Assigned Persona</h3>
          <div className="persona-info">
            <span className="persona-name">{persona.name}</span>
            {persona.rationale && (
              <p className="persona-rationale">{persona.rationale}</p>
            )}
          </div>
        </div>
      )}

      <div className="signal-viewer-sections">
        {signals.subscriptions && (
          <div className="signal-section">
            <h4>📱 Subscriptions</h4>
            <div className="signal-details">
              <div className="signal-row">
                <span>Recurring Merchants (30d):</span>
                <strong>{signals.subscriptions.recurring_merchants?.length || 0}</strong>
              </div>
              <div className="signal-row">
                <span>Monthly Recurring Spend (30d):</span>
                <strong>{formatCurrency(signals.subscriptions.monthly_recurring_spend_30d || 0)}</strong>
              </div>
              <div className="signal-row">
                <span>Subscription Share (30d):</span>
                <strong>{formatPercentage(signals.subscriptions.subscription_share_30d || 0)}</strong>
              </div>
            </div>
          </div>
        )}

        {signals.savings && (
          <div className="signal-section">
            <h4>💰 Savings</h4>
            <div className="signal-details">
              <div className="signal-row">
                <span>Growth Rate (30d):</span>
                <strong>{formatPercentage(signals.savings.growth_rate_30d || 0)}</strong>
              </div>
              <div className="signal-row">
                <span>Emergency Fund Coverage:</span>
                <strong>{(signals.savings.emergency_fund_coverage_30d || 0).toFixed(1)} months</strong>
              </div>
              <div className="signal-row">
                <span>Net Inflow (30d):</span>
                <strong>{formatCurrency(signals.savings.net_inflow_30d || 0)}</strong>
              </div>
            </div>
          </div>
        )}

        {signals.credit && (
          <div className="signal-section">
            <h4>💳 Credit</h4>
            {signals.credit.cards && signals.credit.cards.length > 0 ? (
              <div className="credit-cards-list">
                {signals.credit.cards.map((card, index) => (
                  <div key={index} className="credit-card-detail">
                    <div className="signal-row">
                      <span>{card.account_name || 'Credit Card'}:</span>
                      <strong className={card.utilization_level === 'high' ? 'text-warning' : ''}>
                        {formatPercentage(card.utilization)} utilization
                      </strong>
                    </div>
                    {card.has_interest_charges && (
                      <div className="signal-warning">⚠️ Interest charges detected</div>
                    )}
                    {card.is_overdue && (
                      <div className="signal-error">🚨 Payment overdue</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No credit cards found.</p>
            )}
          </div>
        )}

        {signals.income && (
          <div className="signal-section">
            <h4>💵 Income</h4>
            <div className="signal-details">
              <div className="signal-row">
                <span>Payment Frequency:</span>
                <strong>{signals.income.payment_frequency || 'Unknown'}</strong>
              </div>
              <div className="signal-row">
                <span>Median Pay Gap:</span>
                <strong>{signals.income.median_pay_gap_days || 0} days</strong>
              </div>
              <div className="signal-row">
                <span>Cash Flow Buffer:</span>
                <strong>{(signals.income.cash_flow_buffer_months || 0).toFixed(1)} months</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SignalViewer;

