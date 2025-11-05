import React, { useState } from 'react';
import Card from '../common/Card';
import Loading from '../common/Loading';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import './BehavioralSignals.css';

const BehavioralSignals = ({ behavioralSignals, loading }) => {
  const [timeWindow, setTimeWindow] = useState('short_term'); // 'short_term' (30d) or 'long_term' (180d)

  if (loading) {
    return (
      <Card>
        <Loading message="Loading behavioral signals..." />
      </Card>
    );
  }

  if (!behavioralSignals) {
    return (
      <Card>
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          No behavioral signals available. Enable consent to view your behavioral profile.
        </p>
      </Card>
    );
  }

  // Check if we have both time windows available
  const hasShortTerm = behavioralSignals.subscriptions?.short_term || 
                      behavioralSignals.savings?.short_term ||
                      behavioralSignals.income?.short_term ||
                      behavioralSignals.credit?.short_term;
  const hasLongTerm = behavioralSignals.subscriptions?.long_term || 
                     behavioralSignals.savings?.long_term ||
                     behavioralSignals.income?.long_term ||
                     behavioralSignals.credit?.long_term;

  // Get data for selected time window
  const getTimeWindowData = (signalType) => {
    if (!behavioralSignals[signalType]) return null;
    return timeWindow === 'short_term' 
      ? behavioralSignals[signalType].short_term 
      : behavioralSignals[signalType].long_term;
  };

  const subscriptionData = getTimeWindowData('subscriptions');
  const savingsData = getTimeWindowData('savings');
  const incomeData = getTimeWindowData('income');
  const creditData = getTimeWindowData('credit');

  return (
    <Card className="behavioral-signals-card">
      <div className="behavioral-signals-header">
        <h3 className="behavioral-signals-title">📊 Behavioral Signals</h3>
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

      <div className="behavioral-signals-grid">
        {/* Subscriptions Signal */}
        {subscriptionData && (
          <div className="signal-card">
            <h4 className="signal-card-title">📱 Subscriptions</h4>
            <div className="signal-card-content">
              <div className="signal-metric">
                <span className="signal-metric-label">Recurring Merchants:</span>
                <span className="signal-metric-value">
                  {subscriptionData.recurring_merchants?.length || subscriptionData.recurring_merchant_count || 0}
                </span>
              </div>
              {subscriptionData.total_monthly_recurring_spend !== undefined && (
                <div className="signal-metric">
                  <span className="signal-metric-label">Monthly Recurring Spend:</span>
                  <span className="signal-metric-value">
                    {formatCurrency(subscriptionData.total_monthly_recurring_spend)}
                  </span>
                </div>
              )}
              {subscriptionData.subscription_share !== undefined && (
                <div className="signal-metric">
                  <span className="signal-metric-label">Subscription Share:</span>
                  <span className="signal-metric-value">
                    {formatPercentage((subscriptionData.subscription_share || 0) * 100)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Savings Signal */}
        {savingsData && (
          <div className="signal-card">
            <h4 className="signal-card-title">💰 Savings</h4>
            <div className="signal-card-content">
              {savingsData.growth_rate !== undefined && savingsData.growth_rate !== null && (
                <div className="signal-metric">
                  <span className="signal-metric-label">Growth Rate:</span>
                  <span className="signal-metric-value">
                    {formatPercentage((savingsData.growth_rate || 0) * 100)}
                  </span>
                </div>
              )}
              {savingsData.emergency_fund_coverage_months !== undefined && savingsData.emergency_fund_coverage_months !== null && (
                <div className="signal-metric">
                  <span className="signal-metric-label">Emergency Fund Coverage:</span>
                  <span className="signal-metric-value">
                    {savingsData.emergency_fund_coverage_months.toFixed(1)} months
                  </span>
                </div>
              )}
              {savingsData.net_inflow !== undefined && (
                <div className="signal-metric">
                  <span className="signal-metric-label">Net Inflow:</span>
                  <span className={`signal-metric-value ${savingsData.net_inflow >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(savingsData.net_inflow)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Income Signal */}
        {incomeData && (
          <div className="signal-card">
            <h4 className="signal-card-title">💵 Income</h4>
            <div className="signal-card-content">
              {incomeData.payment_frequency && (
                <div className="signal-metric">
                  <span className="signal-metric-label">Payment Frequency:</span>
                  <span className="signal-metric-value">
                    {incomeData.payment_frequency}
                  </span>
                </div>
              )}
              {incomeData.median_pay_gap_days !== undefined && (
                <div className="signal-metric">
                  <span className="signal-metric-label">Median Pay Gap:</span>
                  <span className="signal-metric-value">
                    {incomeData.median_pay_gap_days} days
                  </span>
                </div>
              )}
              {incomeData.cash_flow_buffer_months !== undefined && incomeData.cash_flow_buffer_months !== null && (
                <div className="signal-metric">
                  <span className="signal-metric-label">Cash Flow Buffer:</span>
                  <span className="signal-metric-value">
                    {incomeData.cash_flow_buffer_months.toFixed(1)} months
                  </span>
                </div>
              )}
              {incomeData.avg_monthly_income !== undefined && (
                <div className="signal-metric">
                  <span className="signal-metric-label">Avg Monthly Income:</span>
                  <span className="signal-metric-value">
                    {formatCurrency(incomeData.avg_monthly_income)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Credit Signal Summary */}
        {creditData && (
          <div className="signal-card">
            <h4 className="signal-card-title">💳 Credit</h4>
            <div className="signal-card-content">
              <div className="signal-metric">
                <span className="signal-metric-label">Credit Cards:</span>
                <span className="signal-metric-value">
                  {creditData.credit_card_count || creditData.cards?.length || 0}
                </span>
              </div>
              {creditData.cards && creditData.cards.length > 0 && (
                <div className="signal-metric">
                  <span className="signal-metric-label">High Utilization Cards:</span>
                  <span className="signal-metric-value">
                    {creditData.cards.filter(c => c.is_high_utilization).length}
                  </span>
                </div>
              )}
              {creditData.has_overdue !== undefined && (
                <div className="signal-metric">
                  <span className="signal-metric-label">Overdue Payments:</span>
                  <span className={`signal-metric-value ${creditData.has_overdue ? 'negative' : 'positive'}`}>
                    {creditData.has_overdue ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {creditData.has_interest_charges !== undefined && (
                <div className="signal-metric">
                  <span className="signal-metric-label">Interest Charges:</span>
                  <span className={`signal-metric-value ${creditData.has_interest_charges ? 'negative' : 'positive'}`}>
                    {creditData.has_interest_charges ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BehavioralSignals;

