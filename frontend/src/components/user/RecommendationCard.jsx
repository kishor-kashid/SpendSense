import React from 'react';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';
import EducationItem from './EducationItem';
import PartnerOffer from './PartnerOffer';
import './RecommendationCard.css';

const RecommendationCard = ({ recommendation, type }) => {
  if (type === 'education') {
    return <EducationItem item={recommendation} />;
  }
  
  if (type === 'offer') {
    return <PartnerOffer offer={recommendation} />;
  }

  return null;
};

export default RecommendationCard;

