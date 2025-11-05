import React from 'react';
import Loading from '../common/Loading';
import { formatPercentage } from '../../utils/formatters';
import './MetricsPanel.css';

const MetricsPanel = ({ metrics, loading }) => {
  if (loading) {
    return (
      <Loading message="Loading metrics..." />
    );
  }

  if (!metrics) {
    return (
      <p>No metrics available.</p>
    );
  }

  const metricItems = [
    {
      label: 'Coverage',
      value: metrics.coverage_percentage || 0,
      target: 100,
      description: 'Users with persona + ≥3 behaviors',
    },
    {
      label: 'Explainability',
      value: metrics.explainability_percentage || 0,
      target: 100,
      description: 'Recommendations with rationales',
    },
    {
      label: 'Latency',
      value: metrics.average_latency_ms || 0,
      target: 5000,
      description: 'Average recommendation generation time (ms)',
      isLatency: true,
    },
    {
      label: 'Auditability',
      value: metrics.auditability_percentage || 0,
      target: 100,
      description: 'Recommendations with decision traces',
    },
  ];

  return (
    <div className="metrics-panel">
      <div className="metrics-grid">
        {metricItems.map((metric, index) => {
          const isTargetMet = metric.isLatency 
            ? metric.value < metric.target 
            : metric.value >= metric.target;
          
          const percentage = metric.isLatency 
            ? (metric.value / metric.target) * 100 
            : metric.value;

          return (
            <div key={index} className="metric-card">
              <div className="metric-header">
                <h4 className="metric-label">{metric.label}</h4>
                <span className={`metric-badge ${isTargetMet ? 'target-met' : 'target-not-met'}`}>
                  {isTargetMet ? '✓' : '✗'}
                </span>
              </div>
              
              <div className="metric-value">
                {metric.isLatency ? (
                  <>
                    <span className="metric-number">{metric.value.toFixed(0)}</span>
                    <span className="metric-unit">ms</span>
                  </>
                ) : (
                  <>
                    <span className="metric-number">{metric.value.toFixed(1)}</span>
                    <span className="metric-unit">%</span>
                  </>
                )}
              </div>

              <div className="metric-progress">
                <div 
                  className={`metric-progress-bar ${isTargetMet ? 'target-met' : 'target-not-met'}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              <div className="metric-details">
                <span className="metric-target">
                  Target: {metric.isLatency ? `< ${metric.target}ms` : `${metric.target}%`}
                </span>
                <p className="metric-description">{metric.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {metrics.total_users && (
        <div className="metrics-summary">
          <div className="summary-item">
            <span className="summary-label">Total Users:</span>
            <span className="summary-value">{metrics.total_users}</span>
          </div>
          {metrics.users_with_consent && (
            <div className="summary-item">
              <span className="summary-label">Users with Consent:</span>
              <span className="summary-value">{metrics.users_with_consent}</span>
            </div>
          )}
          {metrics.total_recommendations && (
            <div className="summary-item">
              <span className="summary-label">Total Recommendations:</span>
              <span className="summary-value">{metrics.total_recommendations}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricsPanel;

