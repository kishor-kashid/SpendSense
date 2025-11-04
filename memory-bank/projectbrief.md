# Project Brief: SpendSense

## Project Overview
**SpendSense** is an explainable, consent-aware financial insights system that analyzes Plaid-style transaction data to detect behavioral patterns, assign personas, and deliver personalized financial education with clear guardrails around eligibility and tone.

## Core Mission
Transform massive transaction data into actionable customer insights without crossing into regulated financial advice. Focus on **education over sales**, **transparency over sophistication**, and **user control over automation**.

## Project Scope

### Deliverables
1. **Synthetic Plaid-style data generator** (50-100 users)
2. **Feature pipeline** detecting subscriptions, savings, credit, income patterns
3. **Persona assignment system** (5 personas + 1 custom persona)
4. **Recommendation engine** with plain-language rationales
5. **Consent and eligibility guardrails**
6. **Operator view** for oversight
7. **Evaluation harness** with metrics

### Key Constraints
- **No real PII** - Use fake names, masked account numbers
- **No live Plaid connection** - Ingest from CSV/JSON
- **Local storage only** - SQLite for relational data, Parquet for analytics
- **No authentication required** - Demo mode for prototype
- **Explainable AI** - Every recommendation must have clear rationale citing concrete data

## Success Criteria

| Category | Metric | Target |
|----------|--------|--------|
| Coverage | Users with assigned persona + ≥3 behaviors | 100% |
| Explainability | Recommendations with rationales | 100% |
| Latency | Time to generate recommendations per user | <5 seconds |
| Auditability | Recommendations with decision traces | 100% |
| Code Quality | Passing unit/integration tests | ≥10 tests |
| Documentation | Schema and decision log clarity | Complete |

## Core Principles
1. **Transparency over sophistication** - Explainable decisions
2. **User control over automation** - Consent management required
3. **Education over sales** - Focus on learning, not product promotion
4. **Fairness built in from day one** - No predatory products, no shaming

## Project Type
Individual or small team project with no strict deadline. Focus on building a complete, working system that demonstrates the core concepts.

## Key Requirements from Requirements Document
- 50-100 synthetic users with diverse financial situations
- 30-day and 180-day analysis windows
- 5 personas with clear criteria
- 3-5 education items per user
- 1-3 partner offers per user (with eligibility checks)
- Mandatory disclaimer: "This is educational content, not financial advice."
- Operator oversight capabilities
- Comprehensive evaluation metrics

