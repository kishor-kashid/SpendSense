import React, { useState } from 'react';
import Loading from '../common/Loading';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import './SignalViewer.css';

const SignalViewer = ({ signals, persona, loading }) => {
  const [timeWindow, setTimeWindow] = useState('short_term'); // 'short_term' (30d) or 'long_term' (180d)

  if (loading) {
    return (
      <Loading message="Loading signals..." />
    );
  }

  if (!signals) {
    return (
      <p>No signals available for this user.</p>
    );
  }

  // Check if we have both time windows available
  const hasShortTerm = signals.subscriptions?.short_term || 
                      signals.savings?.short_term ||
                      signals.income?.short_term ||
                      signals.credit?.short_term;
  const hasLongTerm = signals.subscriptions?.long_term || 
                     signals.savings?.long_term ||
                     signals.income?.long_term ||
                     signals.credit?.long_term;

  // Get data for selected time window
  const getTimeWindowData = (signalType) => {
    if (!signals[signalType]) return null;
    return timeWindow === 'short_term' 
      ? signals[signalType].short_term 
      : signals[signalType].long_term;
  };

  // Extract persona assignments from signals if available
  const personaAssignments = signals?.persona_assignments;

  return (
    <div className="signal-viewer">
      {/* Show both 30d and 180d persona assignments if available */}
      {personaAssignments && (
        <div className="signal-viewer-persona">
          <h3>Persona Assignments</h3>
          <div className="persona-assignments-grid">
            <div className="persona-assignment-item">
              <h4>Short-term (30 days)</h4>
              <div className="persona-info">
                <span className="persona-name">
                  {personaAssignments.short_term_30d?.assigned_persona?.name || 'Not assigned'}
                </span>
                {personaAssignments.short_term_30d?.rationale && (
                  <p className="persona-rationale">{personaAssignments.short_term_30d.rationale}</p>
                )}
              </div>
            </div>
            <div className="persona-assignment-item">
              <h4>Long-term (180 days)</h4>
              <div className="persona-info">
                <span className="persona-name">
                  {personaAssignments.long_term_180d?.assigned_persona?.name || 'Not assigned'}
                </span>
                {personaAssignments.long_term_180d?.rationale && (
                  <p className="persona-rationale">{personaAssignments.long_term_180d.rationale}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback to single persona if assignments not available */}
      {!personaAssignments && persona && (
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

      <div className="signal-viewer-header-controls">
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

      <div className="signal-viewer-sections">
        {(() => {
          const subscriptionData = getTimeWindowData('subscriptions');
          return subscriptionData && (
            <div className="signal-section">
              <h4>📱 Subscriptions</h4>
              <div className="signal-details">
                <div className="signal-row">
                  <span>Recurring Merchants:</span>
                  <strong>{subscriptionData.recurring_merchants?.length || subscriptionData.recurring_merchant_count || 0}</strong>
                </div>
                <div className="signal-row">
                  <span>Monthly Recurring Spend:</span>
                  <strong>{formatCurrency(subscriptionData.total_monthly_recurring_spend || 0)}</strong>
                </div>
                <div className="signal-row">
                  <span>Subscription Share:</span>
                  <strong>{formatPercentage((subscriptionData.subscription_share || 0) * 100)}</strong>
                </div>
              </div>
            </div>
          );
        })()}

        {(() => {
          const savingsData = getTimeWindowData('savings');
          return savingsData && (
            <div className="signal-section">
              <h4>💰 Savings</h4>
              <div className="signal-details">
                {savingsData.growth_rate !== undefined && savingsData.growth_rate !== null && (
                  <div className="signal-row">
                    <span>Growth Rate:</span>
                    <strong>{formatPercentage((savingsData.growth_rate || 0) * 100)}</strong>
                  </div>
                )}
                {savingsData.emergency_fund_coverage_months !== undefined && savingsData.emergency_fund_coverage_months !== null && (
                  <div className="signal-row">
                    <span>Emergency Fund Coverage:</span>
                    <strong>{savingsData.emergency_fund_coverage_months.toFixed(1)} months</strong>
                  </div>
                )}
                {savingsData.net_inflow !== undefined && (
                  <div className="signal-row">
                    <span>Net Inflow:</span>
                    <strong>{formatCurrency(savingsData.net_inflow)}</strong>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {(() => {
          const creditData = getTimeWindowData('credit');
          return creditData && (
            <div className="signal-section">
              <h4>💳 Credit</h4>
              {creditData.cards && creditData.cards.length > 0 ? (
                <div className="credit-cards-list">
                  {creditData.cards.map((card, index) => (
                    <div key={index} className="credit-card-detail">
                      <div className="signal-row">
                        <span>{card.account_name || 'Credit Card'}:</span>
                        <strong className={card.utilization_level === 'high' ? 'text-warning' : ''}>
                          {formatPercentage(card.utilization_percentage || (card.utilization ? card.utilization * 100 : 0))} utilization
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
          );
        })()}

        {(() => {
          const incomeData = getTimeWindowData('income');
          return incomeData && (
            <div className="signal-section">
              <h4>💵 Income</h4>
              <div className="signal-details">
                {incomeData.payment_frequency && (
                  <div className="signal-row">
                    <span>Payment Frequency:</span>
                    <strong>{incomeData.payment_frequency}</strong>
                  </div>
                )}
                {incomeData.median_pay_gap_days !== undefined && (
                  <div className="signal-row">
                    <span>Median Pay Gap:</span>
                    <strong>{incomeData.median_pay_gap_days} days</strong>
                  </div>
                )}
                {incomeData.cash_flow_buffer_months !== undefined && incomeData.cash_flow_buffer_months !== null && (
                  <div className="signal-row">
                    <span>Cash Flow Buffer:</span>
                    <strong>{incomeData.cash_flow_buffer_months.toFixed(1)} months</strong>
                  </div>
                )}
                {incomeData.avg_monthly_income !== undefined && (
                  <div className="signal-row">
                    <span>Avg Monthly Income:</span>
                    <strong>{formatCurrency(incomeData.avg_monthly_income)}</strong>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default SignalViewer;

