import React from 'react';
import './PredictionChart.css';

const PredictionChart = ({ currentBalance, predictedNetFlow, predictedEndBalance, horizonDays }) => {
  // Calculate chart dimensions and values
  // Ensure we have a minimum range for visualization
  const current = currentBalance || 0;
  const end = predictedEndBalance || 0;
  const netFlow = predictedNetFlow || 0;
  
  const values = [
    Math.abs(current),
    Math.abs(end),
    Math.abs(current + netFlow)
  ];
  const maxValue = Math.max(...values, 1000) * 1.2; // Add 20% padding, minimum 1000

  const startY = 50; // Starting Y position
  const chartHeight = 200;
  const chartWidth = 300;
  
  // Calculate positions
  const currentY = startY + (chartHeight * (1 - Math.min(Math.max(current / maxValue, -1), 1) / 2));
  const endY = startY + (chartHeight * (1 - Math.min(Math.max(end / maxValue, -1), 1) / 2));
  const zeroY = startY + chartHeight / 2;

  // Determine color based on trend
  const isPositive = netFlow >= 0;
  const lineColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <div className="prediction-chart">
      <svg width={chartWidth} height={chartHeight + 100} viewBox={`0 0 ${chartWidth} ${chartHeight + 100}`}>
        {/* Zero line */}
        <line
          x1="40"
          y1={zeroY}
          x2={chartWidth - 40}
          y2={zeroY}
          stroke="#94a3b8"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        
        {/* Y-axis labels */}
        <text x="35" y={startY} textAnchor="end" className="chart-label">
          ${(maxValue / 1000).toFixed(1)}k
        </text>
        <text x="35" y={zeroY} textAnchor="end" className="chart-label">
          $0
        </text>
        <text x="35" y={startY + chartHeight} textAnchor="end" className="chart-label">
          -${(maxValue / 1000).toFixed(1)}k
        </text>

        {/* Prediction line */}
        <line
          x1="60"
          y1={currentY}
          x2={chartWidth - 60}
          y2={endY}
          stroke={lineColor}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Current balance point */}
        <circle
          cx="60"
          cy={currentY}
          r="6"
          fill="#3b82f6"
          stroke="#fff"
          strokeWidth="2"
        />
        <text x="60" y={currentY - 15} textAnchor="middle" className="chart-point-label">
          Current
        </text>
        <text x="60" y={currentY + 5} textAnchor="middle" className="chart-value">
          ${current.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </text>

        {/* Predicted end balance point */}
        <circle
          cx={chartWidth - 60}
          cy={endY}
          r="6"
          fill={lineColor}
          stroke="#fff"
          strokeWidth="2"
        />
        <text x={chartWidth - 60} y={endY - 15} textAnchor="middle" className="chart-point-label">
          {horizonDays}d
        </text>
        <text x={chartWidth - 60} y={endY + 5} textAnchor="middle" className="chart-value">
          ${end.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </text>

        {/* X-axis labels */}
        <text x="60" y={chartHeight + 80} textAnchor="middle" className="chart-label">
          Now
        </text>
        <text x={chartWidth - 60} y={chartHeight + 80} textAnchor="middle" className="chart-label">
          +{horizonDays} days
        </text>
      </svg>

      {/* Legend */}
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
          <span>Current Balance</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: lineColor }}></div>
          <span>Projected Balance</span>
        </div>
      </div>
    </div>
  );
};

export default PredictionChart;

