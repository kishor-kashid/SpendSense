import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  title, 
  subtitle,
  footer,
  className = '',
  onClick,
  ...props 
}) => {
  const cardClasses = `card ${onClick ? 'card-clickable' : ''} ${className}`.trim();
  
  return (
    <div className={cardClasses} onClick={onClick} {...props}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

