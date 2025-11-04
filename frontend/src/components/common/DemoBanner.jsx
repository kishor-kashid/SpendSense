import React from 'react';
import './DemoBanner.css';

const DemoBanner = () => {
  return (
    <div className="demo-banner">
      <div className="demo-banner-content">
        <span className="demo-banner-icon">⚠️</span>
        <span className="demo-banner-text">
          <strong>Demo Mode:</strong> This is a demonstration system. No real financial data is processed.
        </span>
      </div>
    </div>
  );
};

export default DemoBanner;

