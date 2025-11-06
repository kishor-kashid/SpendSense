import React from 'react';
import Card from '../common/Card';
import './BudgetDisplay.css';

const BudgetDisplay = ({ budget, loading }) => {
  if (loading) {
    return (
      <Card className="budget-display">
        <div className="budget-loading">Loading budget recommendations...</div>
      </Card>
    );
  }

  if (!budget || !budget.success) {
    if (budget?.error === 'insufficient_data') {
      return (
        <Card className="budget-display budget-insufficient-data">
          <h3>Insufficient Data</h3>
          <p>{budget.message || 'Not enough transaction history to generate a budget.'}</p>
          {budget.recommendations && budget.recommendations.length > 0 && (
            <div className="budget-recommendations">
              <h4>Recommendations:</h4>
              <ul>
                {budget.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      );
    }
    return (
      <Card className="budget-display">
        <div className="budget-error">Unable to load budget recommendations.</div>
      </Card>
    );
  }

  const { categories, monthly_savings_target, emergency_fund_goal, rationale, monthly_income, monthly_expenses_avg } = budget;

  return (
    <div className="budget-display">
      <Card className="budget-summary">
        <h3>Budget Summary</h3>
        <div className="budget-summary-stats">
          <div className="budget-stat">
            <span className="budget-stat-label">Monthly Income</span>
            <span className="budget-stat-value">${monthly_income?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="budget-stat">
            <span className="budget-stat-label">Average Expenses</span>
            <span className="budget-stat-value">${monthly_expenses_avg?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="budget-stat budget-savings">
            <span className="budget-stat-label">Savings Target</span>
            <span className="budget-stat-value">${monthly_savings_target?.toFixed(2) || '0.00'}/month</span>
          </div>
          <div className="budget-stat budget-emergency">
            <span className="budget-stat-label">Emergency Fund Goal</span>
            <span className="budget-stat-value">${emergency_fund_goal?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
        {rationale && (
          <div className="budget-rationale">
            <p>{rationale}</p>
          </div>
        )}
      </Card>

      <Card className="budget-categories">
        <h3>Category Spending Limits</h3>
        <div className="budget-categories-list">
          {categories && categories.length > 0 ? (
            categories.map((cat, idx) => (
              <div key={idx} className="budget-category-item">
                <div className="budget-category-header">
                  <span className="budget-category-name">{cat.category}</span>
                  <div className="budget-category-amounts">
                    <span className="budget-category-limit">${cat.monthly_limit?.toFixed(2) || '0.00'}</span>
                    {cat.current_avg && (
                      <span className={`budget-category-avg ${cat.monthly_limit < cat.current_avg ? 'over-budget' : ''}`}>
                        (Avg: ${cat.current_avg.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
                {cat.rationale && (
                  <div className="budget-category-rationale">
                    <p>{cat.rationale}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No category limits available.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BudgetDisplay;

