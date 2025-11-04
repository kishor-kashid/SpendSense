# Product Context: SpendSense

## Problem Statement
Banks generate massive transaction data through Plaid integrations but struggle to turn it into actionable customer insights without crossing into regulated financial advice. There's a need for an explainable, consent-aware system that provides personalized financial education while maintaining clear boundaries.

## Solution Approach
SpendSense analyzes transaction patterns to:
1. **Detect behavioral signals** (subscriptions, savings habits, credit usage, income patterns)
2. **Assign personas** based on detected behaviors
3. **Deliver personalized recommendations** with clear, data-driven rationales
4. **Maintain guardrails** around consent, eligibility, and tone

## User Experience Goals

### For End Users (Customers)
- **Clear consent process** - Opt-in/opt-out at any time
- **Transparent insights** - Understand why recommendations are made
- **Educational focus** - Learn about financial health, not just products
- **No judgment** - Supportive, empowering tone
- **Actionable recommendations** - Specific, personalized guidance

### For Operators (Internal Users)
- **Oversight dashboard** - View all user signals and personas
- **Review capabilities** - Approve, override, or flag recommendations
- **Decision traces** - Audit trail for every recommendation
- **Metrics monitoring** - Track system performance and coverage

## Key User Flows

### Customer Flow
1. Select user role and user from dropdown (demo mode)
2. View consent prompt
3. Opt-in to data processing
4. View behavioral profile (detected signals)
5. View personalized recommendations (education + offers)
6. Provide feedback on recommendations

### Operator Flow
1. Select operator role
2. View all users with assigned personas
3. Filter/search by persona type
4. Review specific user's signals and recommendations
5. Approve, override, or flag recommendations
6. View decision traces and metrics

## Persona System Goals

### Persona 1: High Utilization
**Target Users:** Those with credit utilization ≥50%, interest charges, minimum-payment-only behavior, or overdue status
**Goal:** Help reduce utilization and interest through payment planning and autopay education

### Persona 2: Variable Income Budgeter
**Target Users:** Those with median pay gap >45 days AND cash-flow buffer <1 month
**Goal:** Provide percent-based budgets, emergency fund basics, smoothing strategies

### Persona 3: Subscription-Heavy
**Target Users:** Those with ≥3 recurring merchants AND (monthly recurring spend ≥$50 OR subscription spend share ≥10%)
**Goal:** Subscription audit, cancellation/negotiation tips, bill alerts

### Persona 4: Savings Builder
**Target Users:** Those with savings growth rate ≥2% OR net savings inflow ≥$200/month, AND all card utilizations <30%
**Goal:** Goal setting, automation, APY optimization (HYSA/CD basics)

### Persona 5: New Users
**Target Users:** New users who may just have created the account and do not have much credit limit or loans
**Goal:** Provide new credit cards or loan offers related to new users

### Persona 6: [Custom Persona - To Be Defined]
**Target Users:** [To be determined during development]
**Goal:** [To be determined during development]

## Content Strategy
- **Education items:** Articles, guides, calculators, templates
- **Partner offers:** Balance transfer cards, high-yield savings, budgeting apps, subscription management tools
- **Tone:** Empowering, educational, neutral, supportive
- **Disclaimers:** Required on all recommendations

## Success Metrics from User Perspective
- Users understand why they received each recommendation
- Users can see their behavioral patterns clearly
- Users feel supported, not judged
- Operators can effectively oversee and review recommendations

