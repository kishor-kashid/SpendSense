import React from 'react';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';
import './SpendingBreakdown.css';

const SpendingBreakdown = ({ insights, loading }) => {
  if (loading) {
    return (
      <Card>
        <p>Loading spending breakdown...</p>
      </Card>
    );
  }

  if (!insights || !insights.categoryBreakdown || insights.categoryBreakdown.length === 0) {
    return (
      <Card>
        <p>No spending data available.</p>
      </Card>
    );
  }

  const { categoryBreakdown, summary } = insights;
  const totalSpending = summary.totalSpending || categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);

  // Get category icon/emoji
  const getCategoryIcon = (category) => {
    const cat = category.toLowerCase();
    if (cat.includes('food')) return '🍔';
    if (cat.includes('transport')) return '🚗';
    if (cat.includes('entertainment')) return '🎬';
    if (cat.includes('shopping')) return '🛍️';
    if (cat.includes('bills')) return '📄';
    if (cat.includes('health')) return '🏥';
    if (cat.includes('travel')) return '✈️';
    if (cat.includes('gas')) return '⛽';
    return '💰';
  };

  return (
    <Card className="spending-breakdown">
      <h3 className="spending-breakdown-title">Spending by Category</h3>
      
      <div className="spending-breakdown-list">
        {categoryBreakdown.map((category, index) => {
          const percentage = totalSpending > 0 ? (category.amount / totalSpending) * 100 : 0;
          
          return (
            <div key={index} className="spending-breakdown-item">
              <div className="spending-breakdown-header">
                <div className="spending-category-info">
                  <span className="spending-category-icon">{getCategoryIcon(category.category)}</span>
                  <span className="spending-category-name">{category.category}</span>
                  <span className="spending-category-count">({category.count} transactions)</span>
                </div>
                <div className="spending-category-amount">
                  {formatCurrency(category.amount)}
                  <span className="spending-category-percentage">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="spending-breakdown-bar">
                <div
                  className="spending-breakdown-bar-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="spending-breakdown-total">
        <strong>Total Spending: {formatCurrency(totalSpending)}</strong>
      </div>
    </Card>
  );
};

export default SpendingBreakdown;

