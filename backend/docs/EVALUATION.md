# SpendSense Evaluation & Metrics System

## Overview

The evaluation system measures the performance and quality of the SpendSense recommendation engine across four key metrics:

1. **Coverage**: Percentage of users with assigned persona and ≥3 detected behaviors
2. **Explainability**: Percentage of recommendations with plain-language rationales
3. **Latency**: Average time to generate recommendations
4. **Auditability**: Percentage of recommendations with decision traces

## Metrics Calculation

### Coverage Metric

**Target:** 100% of users with consent should have both:
- An assigned persona (based on behavioral signals)
- At least 3 detected behavioral signals

**Calculation:**
```
Coverage % = (Users with persona + ≥3 behaviors) / Total users with consent × 100
```

**Behavioral Signals Counted:**
- Subscriptions: Recurring merchants detected
- Savings: Savings growth threshold met
- Credit: High utilization, interest charges, or overdue status
- Income: Variable income pattern detected

### Explainability Metric

**Target:** 100% of recommendations should include plain-language rationales

**Calculation:**
```
Explainability % = (Recommendations with rationales) / Total recommendations × 100
```

**Requirements:**
- Each recommendation (education item or partner offer) must have a rationale
- Rationales must cite specific data points
- Rationales must use plain language (no jargon)

### Latency Metric

**Target:** <5 seconds average recommendation generation time

**Calculation:**
```
Average Latency = Sum of all generation times / Number of users
```

**Measurement:**
- Time measured from start of persona assignment to completion of recommendation generation
- Includes all feature detection, persona assignment, content selection, and rationale generation
- Can be sampled for performance (e.g., first 10 users)

### Auditability Metric

**Target:** 100% of recommendations should include decision traces

**Calculation:**
```
Auditability % = (Recommendations with decision traces) / Total recommendations × 100
```

**Requirements:**
- Decision traces must include persona assignment logic
- Must include signal detection results
- Must include content selection criteria


## Report Formats

### JSON Report (`metrics.json`)

Full metrics data including:
- All metric calculations
- Per-user details
- Per-recommendation details
- Timestamps and calculation metadata

### CSV Report (`metrics.csv`)

Summary metrics in CSV format:
- Metric name
- Current value
- Target value
- Whether target is met
- Description

### Summary Report (`summary_report.md`)

Human-readable markdown report including:
- Executive summary
- Detailed metric breakdowns
- Performance analysis
- Recommendations for improvement

### Decision Traces (`decision_traces/`)

Per-user JSON files containing:
- User ID and name
- Assigned persona
- Persona rationale
- Complete decision trace
- Timestamp

## Running Evaluation

### Full Evaluation Harness (Recommended)

Run the complete evaluation on all synthetic users:

```bash
cd backend
npm run evaluate
```

This will:
1. Initialize the database
2. Load all synthetic data
3. Generate recommendations for all users
4. Calculate all metrics (coverage, explainability, latency, auditability)
5. Generate all reports (JSON, CSV, summary, decision traces)

### From Command Line (Alternative)

```bash
# Calculate metrics for all users
node -e "const { calculateAllMetrics } = require('./src/services/eval/metricsCalculator'); console.log(JSON.stringify(calculateAllMetrics(), null, 2));"

# Generate all reports
node -e "const { generateAllReports } = require('./src/services/eval/reportGenerator'); generateAllReports().then(r => console.log('Reports generated:', r.files_generated));"
```

### From Tests

```bash
# Run evaluation tests
npm test -- --testPathPattern=eval.test.js
```

## Target Metrics

| Metric | Target | Current Status |
|--------|--------|----------------|
| Coverage | 100% | Measured per evaluation |
| Explainability | 100% | ✅ Achieved |
| Latency | <5s | Measured per evaluation |
| Auditability | 100% | ✅ Achieved |

## Interpretation

### Coverage < 100%
- **Possible Causes:** Users without sufficient behavioral signals, consent issues
- **Recommendations:** Improve signal detection algorithms, ensure all users with consent have sufficient transaction history

### Explainability < 100%
- **Possible Causes:** Missing rationales in recommendations
- **Recommendations:** Ensure rationale generation runs for all recommendations

### Latency > 5s
- **Possible Causes:** Complex feature detection, large dataset processing
- **Recommendations:** Optimize database queries, add caching, optimize feature detection algorithms

### Auditability < 100%
- **Possible Causes:** Missing decision traces in recommendations
- **Recommendations:** Ensure decision traces are captured and stored for all recommendations

## Files

- **Metrics Calculator:** `backend/src/services/eval/metricsCalculator.js`
- **Report Generator:** `backend/src/services/eval/reportGenerator.js`
- **Evaluation Script:** `backend/scripts/runEvaluation.js`
- **Tests:** `backend/tests/unit/eval.test.js`
- **Output Directory:** `backend/data/evaluation/`

## Notes

- Metrics are calculated based on users with `consent_status: 'granted'`
- Latency calculation can be sampled for performance (recommended for large user bases)
- Decision traces are automatically stored when recommendations are generated
- All reports include timestamps for audit purposes

## Fairness Analysis

### Note on Demographics
The synthetic user data does not include demographic information (age, gender, race, ethnicity). As a result, fairness analysis based on protected characteristics is not applicable for this evaluation.

### Fairness Considerations
- **Consent-based:** All users have equal access to features when consent is granted
- **Behavioral-based:** Persona assignment is based solely on financial behavior, not demographics
- **Transparent:** All decisions are explainable and auditable
- **No bias in data:** Synthetic data is generated without demographic bias

If demographic data were available in future versions, fairness analysis would include:
- Persona assignment rates by demographic group
- Recommendation quality by demographic group
- Latency performance by demographic group
- Access to features by demographic group

