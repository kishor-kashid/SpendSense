import React from 'react';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';
import './SpendingInsights.css';

const SpendingInsights = ({ insights, loading }) => {
  if (loading) {
    return (
      <Card>
        <p>Loading insights...</p>
      </Card>
    );
  }

  if (!insights || !insights.summary) {
    return (
      <Card>
        <p>No insights available.</p>
      </Card>
    );
  }

  const { summary, topMerchants, trends } = insights;

  // Calculate insights
  const savingsRate = summary.totalIncome > 0
    ? ((summary.netFlow / summary.totalIncome) * 100).toFixed(1)
    : '0.0';

  const avgDailySpending = summary.totalSpending / 30; // Assuming 30-day period

  return (
    <div className="spending-insights">
      <Card className="insights-summary-card">
        <h3 className="insights-title">📊 Spending Summary</h3>
        <div className="insights-grid">
          <div className="insight-item">
            <div className="insight-label">Total Spending</div>
            <div className="insight-value spending">{formatCurrency(summary.totalSpending)}</div>
          </div>
          <div className="insight-item">
            <div className="insight-label">Total Income</div>
            <div className="insight-value income">{formatCurrency(summary.totalIncome)}</div>
          </div>
          <div className="insight-item">
            <div className="insight-label">Net Flow</div>
            <div className={`insight-value ${summary.netFlow >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(summary.netFlow)}
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-label">Savings Rate</div>
            <div className={`insight-value ${parseFloat(savingsRate) >= 0 ? 'positive' : 'negative'}`}>
              {savingsRate}%
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-label">Avg Daily Spending</div>
            <div className="insight-value">{formatCurrency(avgDailySpending)}</div>
          </div>
          <div className="insight-item">
            <div className="insight-label">Transactions</div>
            <div className="insight-value">{summary.transactionCount}</div>
          </div>
        </div>
      </Card>

      {summary.largestTransaction && (
        <Card className="insights-card">
          <h4>💰 Largest Transaction</h4>
          <div className="largest-transaction">
            <div className="largest-transaction-merchant">{summary.largestTransaction.merchant}</div>
            <div className="largest-transaction-amount">{formatCurrency(summary.largestTransaction.amount)}</div>
            <div className="largest-transaction-details">
              <span>{summary.largestTransaction.category}</span>
              <span>•</span>
              <span>{new Date(summary.largestTransaction.date).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>
      )}

      {topMerchants && topMerchants.length > 0 && (
        <Card className="insights-card">
          <h4>🏪 Top Merchants</h4>
          <div className="top-merchants-list">
            {topMerchants.slice(0, 5).map((merchant, index) => (
              <div key={index} className="top-merchant-item">
                <div className="merchant-rank">#{index + 1}</div>
                <div className="merchant-info">
                  <div className="merchant-name">{merchant.merchant}</div>
                  <div className="merchant-count">{merchant.count} transactions</div>
                </div>
                <div className="merchant-amount">{formatCurrency(merchant.amount)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {trends && trends.monthly && Object.keys(trends.monthly).length > 0 && (
        <Card className="insights-card">
          <h4>📈 Monthly Trends</h4>
          <div className="monthly-trends">
            {Object.entries(trends.monthly)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([month, amount]) => (
                <div key={month} className="monthly-trend-item">
                  <div className="trend-month">{new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                  <div className="trend-amount">{formatCurrency(amount)}</div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SpendingInsights;

