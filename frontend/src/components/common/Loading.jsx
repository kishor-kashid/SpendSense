import React from 'react';
import './Loading.css';

const Loading = ({ 
  size = 'medium', 
  message = 'Loading...',
  fullScreen = false 
}) => {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-spinner loading-spinner-large"></div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className={`loading-spinner loading-spinner-${size}`}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default Loading;

