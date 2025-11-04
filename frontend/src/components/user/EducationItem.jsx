import React from 'react';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';
import './EducationItem.css';

const EducationItem = ({ item }) => {
  if (!item) return null;

  return (
    <Card className="education-item">
      <div className="education-item-header">
        <div className="education-item-type">
          {item.category === 'article' && '📄'}
          {item.category === 'guide' && '📚'}
          {item.category === 'calculator' && '🧮'}
          {item.category === 'template' && '📋'}
          <span className="education-item-type-label">{item.category}</span>
        </div>
      </div>

      <h3 className="education-item-title">{item.title}</h3>
      
      {item.description && (
        <p className="education-item-description">{item.description}</p>
      )}

      {item.rationale && (
        <div className="education-item-rationale">
          <strong>Why this matters:</strong>
          <p>{item.rationale}</p>
        </div>
      )}

      {item.url && (
        <div className="education-item-actions">
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="education-item-link"
          >
            View Resource →
          </a>
        </div>
      )}

      <div className="education-item-disclaimer">
        <small>
          <strong>Disclaimer:</strong> This is educational content, not financial advice. Consult a licensed advisor for personalized guidance.
        </small>
      </div>
    </Card>
  );
};

export default EducationItem;

