import React from 'react';
import Card from '../common/Card';
import './GoalsDisplay.css';

const GoalsDisplay = ({ goals, loading }) => {
  if (loading) {
    return (
      <Card className="goals-display">
        <div className="goals-loading">Loading savings goals...</div>
      </Card>
    );
  }

  if (!goals || !goals.success) {
    if (goals?.error === 'insufficient_data') {
      return (
        <Card className="goals-display goals-insufficient-data">
          <h3>Insufficient Data</h3>
          <p>{goals.message || 'Not enough transaction history to generate goals.'}</p>
          {goals.recommendations && goals.recommendations.length > 0 && (
            <div className="goals-recommendations">
              <h4>Recommendations:</h4>
              <ul>
                {goals.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      );
    }
    return (
      <Card className="goals-display">
        <div className="goals-error">Unable to load savings goals.</div>
      </Card>
    );
  }

  const { goals: goalsList, rationale } = goals;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getProgressPercentage = (goal) => {
    if (!goal.target_amount || goal.target_amount === 0) return 0;
    const current = goal.current_progress || 0;
    return Math.min((current / goal.target_amount) * 100, 100);
  };

  const getTimeframeColor = (timeframe) => {
    switch (timeframe) {
      case 'short_term':
        return 'var(--success-color, #22c55e)';
      case 'medium_term':
        return 'var(--warning-color, #f59e0b)';
      case 'long_term':
        return 'var(--primary-color, #3b82f6)';
      default:
        return 'var(--text-secondary, #666)';
    }
  };

  return (
    <div className="goals-display">
      {rationale && (
        <Card className="goals-rationale-card">
          <h3>About Your Goals</h3>
          <p>{rationale}</p>
        </Card>
      )}

      <Card className="goals-list">
        <h3>Your Savings Goals</h3>
        <div className="goals-list-container">
          {goalsList && goalsList.length > 0 ? (
            goalsList.map((goal, idx) => {
              const progress = getProgressPercentage(goal);
              const timeframeColor = getTimeframeColor(goal.timeframe);

              return (
                <div key={idx} className="goal-item">
                  <div className="goal-header">
                    <div className="goal-title-section">
                      <h4 className="goal-name">{goal.name}</h4>
                      <span className="goal-timeframe" style={{ color: timeframeColor }}>
                        {goal.timeframe?.replace('_', ' ').toUpperCase() || 'N/A'}
                      </span>
                    </div>
                    <div className="goal-amounts">
                      <span className="goal-current">
                        ${(goal.current_progress || 0).toFixed(2)}
                      </span>
                      <span className="goal-separator">/</span>
                      <span className="goal-target">
                        ${goal.target_amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="goal-progress-bar-container">
                    <div
                      className="goal-progress-bar"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: timeframeColor
                      }}
                    />
                  </div>

                  <div className="goal-meta">
                    <span className="goal-date">
                      Target: {formatDate(goal.target_date)}
                    </span>
                    <span className="goal-percentage">
                      {progress.toFixed(1)}%
                    </span>
                  </div>

                  {goal.rationale && (
                    <div className="goal-rationale">
                      <p>{goal.rationale}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p>No goals available.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default GoalsDisplay;

