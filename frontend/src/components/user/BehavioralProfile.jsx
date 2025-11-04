import React from 'react';
import Card from '../common/Card';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import './BehavioralProfile.css';

const BehavioralProfile = ({ profile }) => {
  if (!profile) {
    return (
      <Card>
        <p>No profile data available.</p>
      </Card>
    );
  }

  const { persona, signals } = profile;

  return (
    <Card title="Your Behavioral Profile" className="behavioral-profile">
      <div className="profile-content">
        <div className="persona-section">
          <h3 className="section-title">Assigned Persona</h3>
          <div className="persona-badge persona-badge-{persona?.type}">
            {persona?.name || 'Not Assigned'}
          </div>
          {persona?.rationale && (
            <p className="persona-rationale">{persona.rationale}</p>
          )}
        </div>

        <div className="signals-section">
          <h3 className="section-title">Detected Behavioral Signals</h3>
          
          {signals?.subscriptions && (
            <div className="signal-card">
              <h4 className="signal-title">📱 Subscriptions</h4>
              <div className="signal-details">
                <div className="signal-item">
                  <span className="signal-label">Recurring Merchants:</span>
                  <span className="signal-value">{signals.subscriptions.recurring_merchants?.length || 0}</span>
                </div>
                {signals.subscriptions.monthly_recurring_spend_30d && (
                  <div className="signal-item">
                    <span className="signal-label">Monthly Recurring Spend (30d):</span>
                    <span className="signal-value">{formatCurrency(signals.subscriptions.monthly_recurring_spend_30d)}</span>
                  </div>
                )}
                {signals.subscriptions.subscription_share_30d && (
                  <div className="signal-item">
                    <span className="signal-label">Subscription Share (30d):</span>
                    <span className="signal-value">{formatPercentage(signals.subscriptions.subscription_share_30d)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {signals?.savings && (
            <div className="signal-card">
              <h4 className="signal-title">💰 Savings</h4>
              <div className="signal-details">
                {signals.savings.growth_rate_30d && (
                  <div className="signal-item">
                    <span className="signal-label">Growth Rate (30d):</span>
                    <span className="signal-value">{formatPercentage(signals.savings.growth_rate_30d)}</span>
                  </div>
                )}
                {signals.savings.emergency_fund_coverage_30d && (
                  <div className="signal-item">
                    <span className="signal-label">Emergency Fund Coverage:</span>
                    <span className="signal-value">{signals.savings.emergency_fund_coverage_30d.toFixed(1)} months</span>
                  </div>
                )}
                {signals.savings.net_inflow_30d && (
                  <div className="signal-item">
                    <span className="signal-label">Net Inflow (30d):</span>
                    <span className="signal-value">{formatCurrency(signals.savings.net_inflow_30d)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {signals?.credit && (
            <div className="signal-card">
              <h4 className="signal-title">💳 Credit</h4>
              <div className="signal-details">
                {signals.credit.cards && signals.credit.cards.length > 0 && (
                  <div className="credit-cards">
                    {signals.credit.cards.map((card, index) => (
                      <div key={index} className="credit-card-item">
                        <div className="signal-item">
                          <span className="signal-label">{card.account_name || 'Credit Card'}:</span>
                          <span className={`signal-value ${card.utilization_level === 'high' ? 'text-warning' : ''}`}>
                            {formatPercentage(card.utilization)} utilization
                          </span>
                        </div>
                        {card.has_interest_charges && (
                          <div className="signal-item signal-warning">
                            <span>⚠️ Interest charges detected</span>
                          </div>
                        )}
                        {card.is_overdue && (
                          <div className="signal-item signal-error">
                            <span>🚨 Payment overdue</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {signals?.income && (
            <div className="signal-card">
              <h4 className="signal-title">💵 Income</h4>
              <div className="signal-details">
                {signals.income.payment_frequency && (
                  <div className="signal-item">
                    <span className="signal-label">Payment Frequency:</span>
                    <span className="signal-value">{signals.income.payment_frequency}</span>
                  </div>
                )}
                {signals.income.median_pay_gap_days && (
                  <div className="signal-item">
                    <span className="signal-label">Median Pay Gap:</span>
                    <span className="signal-value">{signals.income.median_pay_gap_days} days</span>
                  </div>
                )}
                {signals.income.cash_flow_buffer_months && (
                  <div className="signal-item">
                    <span className="signal-label">Cash Flow Buffer:</span>
                    <span className="signal-value">{signals.income.cash_flow_buffer_months.toFixed(1)} months</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BehavioralProfile;

