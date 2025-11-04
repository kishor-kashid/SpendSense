import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import './DecisionTrace.css';

const DecisionTrace = ({ decisionTrace }) => {
  const [expanded, setExpanded] = useState(false);

  if (!decisionTrace) {
    return (
      <Card>
        <p>No decision trace available.</p>
      </Card>
    );
  }

  return (
    <Card title="Decision Trace" className="decision-trace">
      <div className="decision-trace-content">
        <div className="decision-trace-section">
          <h4>Persona Assignment</h4>
          {decisionTrace.persona_assignment && (
            <div className="trace-details">
              <div className="trace-item">
                <span className="trace-label">Assigned Persona:</span>
                <span className="trace-value">{decisionTrace.persona_assignment.persona_name}</span>
              </div>
              {decisionTrace.persona_assignment.matching_personas && (
                <div className="trace-item">
                  <span className="trace-label">Matching Personas:</span>
                  <span className="trace-value">
                    {decisionTrace.persona_assignment.matching_personas.join(', ')}
                  </span>
                </div>
              )}
              {decisionTrace.persona_assignment.rationale && (
                <div className="trace-item">
                  <span className="trace-label">Rationale:</span>
                  <span className="trace-value">{decisionTrace.persona_assignment.rationale}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {decisionTrace.signals && (
          <div className="decision-trace-section">
            <h4>Behavioral Signals</h4>
            <div className="trace-details">
              {decisionTrace.signals.subscriptions && (
                <div className="trace-item">
                  <span className="trace-label">Subscriptions Detected:</span>
                  <span className="trace-value">
                    {decisionTrace.signals.subscriptions.recurring_merchants?.length || 0} recurring merchants
                  </span>
                </div>
              )}
              {decisionTrace.signals.credit && (
                <div className="trace-item">
                  <span className="trace-label">Credit Analysis:</span>
                  <span className="trace-value">
                    {decisionTrace.signals.credit.cards?.length || 0} credit cards analyzed
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {decisionTrace.content_selection && (
          <div className="decision-trace-section">
            <h4>Content Selection</h4>
            <div className="trace-details">
              <div className="trace-item">
                <span className="trace-label">Education Items Selected:</span>
                <span className="trace-value">
                  {decisionTrace.content_selection.education_items_count || 0}
                </span>
              </div>
              <div className="trace-item">
                <span className="trace-label">Partner Offers Selected:</span>
                <span className="trace-value">
                  {decisionTrace.content_selection.partner_offers_count || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {decisionTrace.guardrails && (
          <div className="decision-trace-section">
            <h4>Guardrails Applied</h4>
            <div className="trace-details">
              <div className="trace-item">
                <span className="trace-label">Consent Check:</span>
                <span className="trace-value trace-success">
                  {decisionTrace.guardrails.consent_checked ? '✓ Passed' : '✗ Failed'}
                </span>
              </div>
              <div className="trace-item">
                <span className="trace-label">Eligibility Filter:</span>
                <span className="trace-value trace-success">
                  {decisionTrace.guardrails.eligibility_checked ? '✓ Passed' : '✗ Failed'}
                </span>
              </div>
              <div className="trace-item">
                <span className="trace-label">Tone Validation:</span>
                <span className="trace-value trace-success">
                  {decisionTrace.guardrails.tone_validated ? '✓ Passed' : '✗ Failed'}
                </span>
              </div>
            </div>
          </div>
        )}

        {expanded && decisionTrace.full_trace && (
          <div className="decision-trace-section">
            <h4>Full Trace (JSON)</h4>
            <pre className="trace-json">
              {JSON.stringify(decisionTrace.full_trace, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {decisionTrace.full_trace && (
        <div className="decision-trace-actions">
          <Button
            variant="outline"
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide' : 'Show'} Full Trace
          </Button>
        </div>
      )}
    </Card>
  );
};

export default DecisionTrace;

