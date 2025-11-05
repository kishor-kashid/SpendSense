import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import './PartnerOffer.css';

const PartnerOffer = ({ offer }) => {
  if (!offer) return null;

  // Handle both category and offer_category fields
  const category = offer.category || offer.offer_category || 'unknown';
  const categoryLabel = category ? category.replace(/_/g, ' ') : 'Offer';

  return (
    <Card className="partner-offer">
      <div className="partner-offer-header">
        <div className="partner-offer-type">
          {category === 'balance_transfer' && '💳'}
          {category === 'high_yield_savings' && '💰'}
          {category === 'budgeting' && '📊'}
          {category === 'subscription' && '📱'}
          {category === 'subscription_management' && '📱'}
          {category === 'credit_builder' && '🏗️'}
          {category === 'debt_consolidation' && '🔗'}
          <span className="partner-offer-type-label">{categoryLabel}</span>
        </div>
        {offer.eligibility && offer.eligibility.eligible && (
          <span className="partner-offer-badge eligible">Eligible</span>
        )}
        {offer.eligibility && !offer.eligibility.eligible && (
          <span className="partner-offer-badge not-eligible">Not Eligible</span>
        )}
      </div>

      <h3 className="partner-offer-title">{offer.title}</h3>
      
      {offer.description && (
        <p className="partner-offer-description">{offer.description}</p>
      )}

      {offer.benefits && offer.benefits.length > 0 && (
        <div className="partner-offer-benefits">
          <strong>Benefits:</strong>
          <ul>
            {offer.benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        </div>
      )}

      {offer.eligibility && !offer.eligibility.eligible && offer.eligibility.disqualifiers && (
        <div className="partner-offer-disqualifiers">
          <strong>Not eligible because:</strong>
          <ul>
            {offer.eligibility.disqualifiers.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {offer.url && (
        <div className="partner-offer-actions">
          <a 
            href={offer.url} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button 
              variant="primary" 
              disabled={offer.eligibility && !offer.eligibility.eligible}
              fullWidth
            >
              Learn More →
            </Button>
          </a>
        </div>
      )}
    </Card>
  );
};

export default PartnerOffer;

