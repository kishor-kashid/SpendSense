import React, { useState } from 'react';
import Card from '../common/Card';
import './PredictiveInsights.css';

const PredictiveInsights = ({ predictions, onRefresh }) => {
  const [selectedHorizon, setSelectedHorizon] = useState('30_days');

  // Handle both direct predictions object and nested structure
  const predictionsData = predictions?.predictions || predictions;

  if (!predictions || (!predictionsData || Object.keys(predictionsData).length === 0)) {
    return (
      <Card>
        <p>No predictions available. Please try refreshing.</p>
        {onRefresh && (
          <button onClick={onRefresh} className="retry-button" style={{ marginTop: '10px' }}>
            Refresh Predictions
          </button>
        )}
      </Card>
    );
  }

  const availableHorizons = Object.keys(predictionsData).filter(key => 
    predictionsData[key] && !predictionsData[key].error
  );

  if (availableHorizons.length === 0) {
    return (
      <Card>
        <p>Unable to generate predictions at this time. Please try again later.</p>
      </Card>
    );
  }

  // Set default to first available horizon if current selection is not available
  const currentHorizon = availableHorizons.includes(selectedHorizon) 
    ? selectedHorizon 
    : availableHorizons[0];

  const currentPrediction = predictionsData[currentHorizon];

  if (!currentPrediction || currentPrediction.error) {
    return (
      <Card>
        <p>Error loading predictions for selected horizon.</p>
      </Card>
    );
  }

  const horizonDays = currentPrediction.horizon_days || 30;
  const pred = currentPrediction.predictions || {};
  const stressPoints = currentPrediction.stress_points || [];

  return (
    <div className="predictive-insights">
      {/* Horizon Selector */}
      <Card className="horizon-selector-card">
        <div className="horizon-selector">
          <label>Prediction Horizon:</label>
          <div className="horizon-buttons">
            {availableHorizons.map(horizon => {
              const days = predictionsData[horizon]?.horizon_days || 
                (horizon === '7_days' ? 7 : horizon === '30_days' ? 30 : 90);
              return (
                <button
                  key={horizon}
                  className={`horizon-button ${currentHorizon === horizon ? 'active' : ''}`}
                  onClick={() => setSelectedHorizon(horizon)}
                >
                  {days} Days
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* AI Summary */}
      {currentPrediction.ai_summary && (
        <Card className="ai-summary-card">
          <h3>AI Analysis Summary</h3>
          <p className="ai-summary-text">{currentPrediction.ai_summary}</p>
        </Card>
      )}

      {/* Predictions Overview */}
      <Card className="predictions-overview-card">
        <h3>{horizonDays}-Day Financial Forecast</h3>
        <div className="predictions-grid">
          <div className="prediction-item">
            <div className="prediction-label">Predicted Income</div>
            <div className="prediction-value income">
              ${pred.predicted_income?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>
          <div className="prediction-item">
            <div className="prediction-label">Predicted Expenses</div>
            <div className="prediction-value expense">
              ${pred.predicted_expenses?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>
          <div className="prediction-item">
            <div className="prediction-label">Net Cash Flow</div>
            <div className={`prediction-value ${(pred.predicted_net_flow || 0) >= 0 ? 'positive' : 'negative'}`}>
              ${pred.predicted_net_flow?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>
          <div className="prediction-item">
            <div className="prediction-label">Projected Balance</div>
            <div className={`prediction-value ${(pred.predicted_end_balance || 0) >= 0 ? 'positive' : 'negative'}`}>
              ${pred.predicted_end_balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>
        </div>
        <div className="confidence-level">
          <span className="confidence-label">Confidence:</span>
          <span className={`confidence-badge ${pred.confidence_level || 'low'}`}>
            {pred.confidence_level || 'low'}
          </span>
        </div>
      </Card>

      {/* Stress Points */}
      {stressPoints.length > 0 && (
        <Card className="stress-points-card">
          <h3>⚠️ Potential Financial Stress Points</h3>
          <div className="stress-points-list">
            {stressPoints.map((point, index) => (
              <div key={index} className={`stress-point ${point.severity}`}>
                <div className="stress-point-header">
                  <span className="stress-point-type">{point.type.replace('_', ' ')}</span>
                  <span className={`stress-point-severity ${point.severity}`}>
                    {point.severity}
                  </span>
                </div>
                <p className="stress-point-message">{point.message || point.description}</p>
                {point.daysUntilShortfall && (
                  <p className="stress-point-detail">
                    Estimated days until shortfall: {point.daysUntilShortfall}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PredictiveInsights;

