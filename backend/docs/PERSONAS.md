# Persona System Documentation

## Overview

The SpendSense persona system assigns users to one of five personas based on their financial behavioral patterns. Each persona represents a distinct financial profile and guides the type of recommendations and educational content provided.

## Persona Priority Order

When a user matches multiple personas, the system assigns the highest priority persona:

1. **High Utilization** (Priority 5) - Highest priority
2. **Variable Income Budgeter** (Priority 4)
3. **Subscription-Heavy** (Priority 3)
4. **Savings Builder** (Priority 2)
5. **New User** (Priority 1) - Lowest priority (fallback)

## Persona Definitions

### Persona 1: High Utilization

**Priority:** 5 (Highest)

**Target Users:** Users with credit card utilization issues, interest charges, or payment problems.

**Criteria:**
- Any credit card with utilization ≥50% OR
- Interest charges present OR
- Minimum-payment-only behavior OR
- Overdue payment status

**Analysis Windows:** 30-day and 180-day windows

**Educational Focus:** 
- Reduce utilization and interest through payment planning
- Autopay setup education
- Debt paydown strategies

**Recommendation Types:**
- Debt paydown strategies
- Payment planning
- Autopay setup
- Balance transfer cards (if eligible)

**Example Rationale:**
> "We noticed your Visa ending in 4523 has 68% utilization ($3,400 of $5,000 limit), you're paying $87.50 in interest charges."

---

### Persona 2: Variable Income Budgeter

**Priority:** 4

**Target Users:** Users with irregular income patterns and limited cash reserves.

**Criteria:**
- Median pay gap > 45 days AND
- Cash-flow buffer < 1 month

**Analysis Windows:** 30-day and 180-day windows

**Educational Focus:**
- Percent-based budgets
- Emergency fund basics
- Income smoothing strategies

**Recommendation Types:**
- Budgeting tools and templates
- Emergency fund building
- Income smoothing strategies
- Savings strategies

**Example Rationale:**
> "We noticed your paychecks come 60 days apart on average and you have 0.5 months of expenses saved."

---

### Persona 3: Subscription-Heavy

**Priority:** 3

**Target Users:** Users with multiple recurring subscriptions consuming significant spending.

**Criteria:**
- Recurring merchants ≥3 AND
- (Monthly recurring spend ≥$50 in 30d OR subscription spend share ≥10%)

**Analysis Windows:** 30-day and 180-day windows

**Educational Focus:**
- Subscription audit
- Cancellation/negotiation tips
- Bill alerts and management

**Recommendation Types:**
- Subscription audit tools
- Bill management apps
- Spending tracking
- Negotiation tips

**Example Rationale:**
> "We noticed you have 5 recurring subscriptions, you're spending $75.00/month on subscriptions, subscriptions make up 12% of your spending."

---

### Persona 4: Savings Builder

**Priority:** 2

**Target Users:** Users actively building savings with good credit utilization.

**Criteria:**
- (Savings growth rate ≥2% OR net savings inflow ≥$200/month) AND
- All credit cards have utilization <30%

**Analysis Windows:** 30-day and 180-day windows

**Educational Focus:**
- Goal setting
- Automation strategies
- APY optimization (HYSA/CD basics)

**Recommendation Types:**
- Savings goals
- Automation tools
- High-yield savings accounts (HYSA)
- Certificate of Deposit (CD) basics
- Investment basics

**Example Rationale:**
> "Great job! We noticed your savings are growing at 3.2%, you're saving $250.00/month, you're keeping credit utilization low."

---

### Persona 5: New User

**Priority:** 1 (Lowest - Fallback)

**Target Users:** Recently joined users with limited credit history or accounts.

**Criteria:**
- User created within last 90 days AND
- Limited credit (no cards OR all cards have limits <$1,000) AND
- Few accounts (≤2 accounts)

**Educational Focus:**
- Build credit history
- Understand financial products
- Establish good financial habits

**Recommendation Types:**
- Credit building strategies
- First credit card guidance
- Financial basics
- Account setup guidance

**Example Rationale:**
> "Welcome! You've been with us for 15 days. We'd like to help you build your financial foundation."

---

## Persona Assignment Logic

### Assignment Process

1. **Feature Analysis:** Run all feature detectors (credit, income, subscriptions, savings)
2. **Persona Matching:** Check each persona against analysis results
3. **Prioritization:** If multiple personas match, select highest priority
4. **Fallback:** If no personas match, assign New User persona
5. **Decision Trace:** Record all matching personas and selection rationale

### Decision Trace

Each persona assignment includes a decision trace:

```javascript
{
  timestamp: "2024-01-15T10:30:00Z",
  allMatches: [
    {
      personaId: "high_utilization",
      personaName: "High Utilization",
      priority: 5,
      rationale: "We noticed your Visa ending in 4523 has 68% utilization..."
    },
    {
      personaId: "subscription_heavy",
      personaName: "Subscription-Heavy",
      priority: 3,
      rationale: "We noticed you have 5 recurring subscriptions..."
    }
  ],
  selectedPersona: "high_utilization",
  selectedPersonaName: "High Utilization",
  selectionReason: "Selected highest priority persona (priority: 5)",
  priorityOrder: ["high_utilization", "subscription_heavy"]
}
```

## Implementation Details

### Files

- `personaDefinitions.js` - Persona definitions and matching logic
- `personaPrioritizer.js` - Prioritization and assignment logic
- `personaAssigner.js` - Main service orchestrating persona assignment

### Usage

```javascript
const { assignPersonaToUser } = require('./services/personas/personaAssigner');

// Assign persona to a user
const result = assignPersonaToUser(userId);

console.log(result.assigned_persona.name); // "High Utilization"
console.log(result.rationale); // "We noticed your Visa..."
console.log(result.decision_trace); // Full decision trace
```

### Testing

All personas are tested in `tests/unit/personas.test.js`:
- Each persona's matching criteria
- Prioritization logic
- End-to-end assignment
- Edge cases

## Custom Persona Note

Persona 5 (New User) is considered a custom persona as it was defined based on the project requirements. It serves as both a specific persona for new users and a fallback when no other personas match.

## Future Enhancements

Potential additional personas:
- **Emergency Fund Builder** - Users actively building emergency funds
- **Debt Paydown Focus** - Users with multiple debts requiring consolidation
- **Investment Starter** - Users ready to begin investing

These would require additional behavioral signal detection and can be added following the same pattern as existing personas.

