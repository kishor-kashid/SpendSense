import React from 'react';
import './DecisionTrace.css';

const DecisionTrace = ({ decisionTrace }) => {

  if (!decisionTrace) {
    return (
      <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No decision trace available.</p>
    );
  }

  // Handle both old format (persona_assignment) and new format (selectedPersona, allMatches)
  const hasPersonaAssignment = decisionTrace.persona_assignment;
  const hasNewFormat = decisionTrace.selectedPersona || decisionTrace.allMatches;

  return (
    <div className="decision-trace">
      <div className="decision-trace-content">
        <div className="decision-trace-section">
          <h4>Persona Assignment</h4>
          {hasPersonaAssignment ? (
            <div className="trace-details">
              <div className="trace-item">
                <span className="trace-label">Assigned Persona:</span>
                <span className="trace-value">{decisionTrace.persona_assignment.persona_name}</span>
              </div>
              {decisionTrace.persona_assignment.matching_personas && (
                <div className="trace-item">
                  <span className="trace-label">Matching Personas:</span>
                  <span className="trace-value">
                    {Array.isArray(decisionTrace.persona_assignment.matching_personas) 
                      ? decisionTrace.persona_assignment.matching_personas.join(', ')
                      : String(decisionTrace.persona_assignment.matching_personas)}
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
          ) : hasNewFormat ? (
            <div className="trace-details">
              <div className="trace-item">
                <span className="trace-label">Selected Persona:</span>
                <span className="trace-value">{decisionTrace.selectedPersonaName || decisionTrace.selectedPersona || 'Unknown'}</span>
              </div>
              {decisionTrace.selectionReason && (
                <div className="trace-item">
                  <span className="trace-label">Selection Reason:</span>
                  <span className="trace-value">{decisionTrace.selectionReason}</span>
                </div>
              )}
              {decisionTrace.allMatches && Array.isArray(decisionTrace.allMatches) && decisionTrace.allMatches.length > 0 && (
                <div className="trace-item">
                  <span className="trace-label">All Matching Personas:</span>
                  <div className="trace-value">
                    <ul style={{ margin: 'var(--spacing-xs) 0', paddingLeft: 'var(--spacing-lg)' }}>
                      {decisionTrace.allMatches.map((match, idx) => (
                        <li key={idx}>
                          <strong>{match.personaName || match.personaId}</strong>
                          {match.priority !== undefined && ` (Priority: ${match.priority})`}
                          {match.rationale && (
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                              {match.rationale}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {decisionTrace.priorityOrder && Array.isArray(decisionTrace.priorityOrder) && (
                <div className="trace-item">
                  <span className="trace-label">Priority Order:</span>
                  <span className="trace-value">
                    {decisionTrace.priorityOrder.join(' → ')}
                  </span>
                </div>
              )}
              {decisionTrace.timestamp && (
                <div className="trace-item">
                  <span className="trace-label">Timestamp:</span>
                  <span className="trace-value">
                    {new Date(decisionTrace.timestamp).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No persona assignment data available.</p>
          )}
        </div>

        {(decisionTrace.signals || decisionTrace.behavioral_signals) && (
          <div className="decision-trace-section">
            <h4>Behavioral Signals</h4>
            <div className="trace-details">
              {(() => {
                const signals = decisionTrace.signals || decisionTrace.behavioral_signals || {};
                return (
                  <>
                    {signals.subscriptions && (
                      <div className="trace-item">
                        <span className="trace-label">Subscriptions Detected:</span>
                        <span className="trace-value">
                          {signals.subscriptions.short_term?.recurring_merchants?.length || 
                           signals.subscriptions.recurring_merchants?.length || 
                           0} recurring merchants
                        </span>
                      </div>
                    )}
                    {signals.credit && (
                      <div className="trace-item">
                        <span className="trace-label">Credit Analysis:</span>
                        <span className="trace-value">
                          {signals.credit.short_term?.cards?.length || 
                           signals.credit.cards?.length || 
                           0} credit cards analyzed
                        </span>
                      </div>
                    )}
                    {signals.income && (
                      <div className="trace-item">
                        <span className="trace-label">Income Analysis:</span>
                        <span className="trace-value">
                          {signals.income.has_payroll_income ? 'Payroll income detected' : 'No payroll income detected'}
                        </span>
                      </div>
                    )}
                    {signals.savings && (
                      <div className="trace-item">
                        <span className="trace-label">Savings Analysis:</span>
                        <span className="trace-value">
                          {signals.savings.has_savings_accounts ? 'Savings accounts detected' : 'No savings accounts detected'}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {(decisionTrace.content_selection || decisionTrace.summary) && (
          <div className="decision-trace-section">
            <h4>Content Selection</h4>
            <div className="trace-details">
              {(() => {
                const content = decisionTrace.content_selection || decisionTrace.summary || {};
                return (
                  <>
                    <div className="trace-item">
                      <span className="trace-label">Education Items Selected:</span>
                      <span className="trace-value">
                        {content.education_items_count || content.education_count || 0}
                      </span>
                    </div>
                    <div className="trace-item">
                      <span className="trace-label">Partner Offers Selected:</span>
                      <span className="trace-value">
                        {content.partner_offers_count || content.partner_offers_count || 0}
                      </span>
                    </div>
                    {content.total_recommendations !== undefined && (
                      <div className="trace-item">
                        <span className="trace-label">Total Recommendations:</span>
                        <span className="trace-value">
                          {content.total_recommendations}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
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
      </div>
    </div>
  );
};

export default DecisionTrace;

