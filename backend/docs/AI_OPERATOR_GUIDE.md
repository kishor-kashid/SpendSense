# AI Features Operator Guide

## Overview

This guide helps operators understand and manage AI features in SpendSense. Operators can monitor AI feature usage, review AI-generated content, and troubleshoot issues.

## AI Features Overview

SpendSense includes four AI-powered features:

1. **Dynamic Rationale Generation** - AI-generated recommendation rationales
2. **Predictive Financial Insights** - Forecast future spending, income, cash flow
3. **Budget & Goal Generation** - AI-powered budgets and savings goals
4. **Subscription Cancellation Suggestions** - Smart subscription analysis

All AI features require **AI consent** (separate from data processing consent).

---

## Monitoring AI Features

### View AI Consent Status

**Operator Dashboard → Users Tab:**
- AI consent status is displayed for each user
- Shows "AI Consent: Granted" or "AI Consent: Revoked"
- Updates in real-time when users toggle consent

**API Endpoint:**
```bash
GET /operator/users
# Response includes ai_consent_status for each user
```

### Check AI Feature Usage

**Current Limitations:**
- No dedicated AI usage analytics dashboard
- No per-feature usage tracking
- No cost tracking per user

**Future Improvements:**
- AI usage analytics dashboard
- Cost tracking per user/feature
- Usage patterns and trends

**Workaround:**
- Check backend logs for AI API calls
- Monitor OpenAI dashboard for usage
- Review cache hit rates in code

---

## Reviewing AI-Generated Content

### Rationales

AI-generated rationales appear alongside template rationales in recommendations:

**Operator Dashboard → Review Queue:**
- View recommendations with AI rationales
- Compare AI rationales vs template rationales
- Approve/reject recommendations as normal

**Identifying AI Rationales:**
- AI rationales are more personalized
- Include specific data points and numbers
- More contextual and persona-specific

**Quality Checks:**
- Verify tone is non-judgmental
- Check for specific data citations
- Ensure relevance to user's persona

### Predictive Insights

**Not Reviewable:**
- Predictive insights are generated on-demand
- Not stored in review queue
- Users see predictions directly

**Monitoring:**
- Check backend logs for prediction requests
- Review error rates
- Monitor response times

### Budgets & Goals

**Not Reviewable:**
- Budgets and goals are generated on-demand
- Not stored in review queue
- Users see budgets/goals directly

**Monitoring:**
- Check backend logs for generation requests
- Review error rates
- Monitor insufficient data errors

### Subscription Suggestions

**Not Reviewable:**
- Subscription suggestions are generated on-demand
- Not stored in review queue
- Users see suggestions directly

**Monitoring:**
- Check backend logs for suggestion requests
- Review analysis accuracy
- Monitor calculation errors

---

## Troubleshooting AI Features

### User Reports: "AI Features Not Working"

**Checklist:**
1. ✅ Verify AI consent is granted
   - Check user's AI consent status
   - Verify in database if needed

2. ✅ Check OpenAI configuration
   - Verify `OPENAI_API_KEY` is set
   - Check backend logs for configuration errors

3. ✅ Verify user has data processing consent
   - Some features require both consents
   - Check user's consent status

4. ✅ Check for errors in backend logs
   - Look for OpenAI API errors
   - Check rate limit errors
   - Review cache issues

### User Reports: "Incorrect Calculations"

**Subscription Analysis:**
- Check transaction data for the merchant
- Verify calculation logic in `subscriptionAnalyzer.js`
- Review monthly spend calculations

**Budget/Goals:**
- Verify user has ≥90 days of transaction history
- Check transaction data quality
- Review spending analysis

### User Reports: "Slow Responses"

**Check:**
- Cache hit rates (should be >80%)
- OpenAI API status (https://status.openai.com)
- Rate limiting (check if hitting limits)
- Network latency

**Solutions:**
- Clear cache if needed
- Wait for OpenAI to recover
- Check rate limit settings

---

## AI Consent Management

### Granting AI Consent (Manual)

**Database:**
```sql
INSERT INTO ai_consent (user_id, status, timestamp)
VALUES (1, 'granted', datetime('now'));
```

**API:**
```bash
POST /ai-consent
Content-Type: application/json

{
  "user_id": 1
}
```

### Revoking AI Consent (Manual)

**Database:**
```sql
UPDATE ai_consent 
SET status = 'revoked', timestamp = datetime('now')
WHERE user_id = 1;
```

**API:**
```bash
DELETE /ai-consent/1
```

### Bulk Operations

**Future Feature:**
- Bulk grant/revoke AI consent
- Export consent status
- Consent analytics

---

## Cost Management

### Monitoring Costs

**Current:**
- Manual monitoring via OpenAI dashboard
- No automated cost tracking in SpendSense

**OpenAI Dashboard:**
1. Visit https://platform.openai.com/usage
2. View usage by date
3. Check costs per model

### Cost Optimization

**Strategies:**
1. **Monitor Cache Hit Rates:**
   - Target >80% for frequently accessed features
   - Increase cache durations if hit rate is low

2. **Review Rate Limiting:**
   - Ensure limits are appropriate
   - Prevent abuse

3. **Check Data Sanitization:**
   - Verify only essential data is sent
   - Reduce token counts

4. **Monitor Usage Patterns:**
   - Identify high-usage users
   - Review feature usage distribution

**Documentation:**
- See [`AI_COST_OPTIMIZATION.md`](./AI_COST_OPTIMIZATION.md) for details

---

## Best Practices

### 1. Regular Monitoring

- Check AI consent status weekly
- Monitor error rates daily
- Review cost trends monthly

### 2. Quality Assurance

- Spot-check AI-generated content
- Verify tone is appropriate
- Check data accuracy

### 3. User Support

- Help users enable AI consent
- Troubleshoot AI feature issues
- Explain AI feature benefits

### 4. Cost Management

- Monitor API usage
- Optimize cache settings
- Review rate limits

---

## Common Operator Tasks

### Task: Enable AI Features for User

1. **Check Current Status:**
   ```bash
   GET /ai-consent/:user_id
   ```

2. **Grant Consent:**
   ```bash
   POST /ai-consent
   { "user_id": 1 }
   ```

3. **Verify:**
   - User can now access AI features
   - Check operator dashboard for status update

### Task: Disable AI Features for User

1. **Revoke Consent:**
   ```bash
   DELETE /ai-consent/:user_id
   ```

2. **Verify:**
   - User sees AI consent required message
   - Features fall back to templates

### Task: Troubleshoot AI Feature Issue

1. **Check User Status:**
   - AI consent: Granted?
   - Data processing consent: Granted?
   - Sufficient transaction history?

2. **Check Backend:**
   - OpenAI configured?
   - API key valid?
   - Rate limits OK?

3. **Check Logs:**
   - Error messages?
   - API response codes?
   - Cache issues?

### Task: Review AI-Generated Content Quality

1. **Rationales:**
   - Check recommendations in review queue
   - Compare AI vs template rationales
   - Verify tone and accuracy

2. **Predictions:**
   - Review prediction accuracy (if possible)
   - Check for unrealistic forecasts
   - Verify data citations

---

## API Reference for Operators

### AI Consent Endpoints

```bash
# Get AI consent status
GET /ai-consent/:user_id

# Grant AI consent
POST /ai-consent
{ "user_id": 1 }

# Revoke AI consent
DELETE /ai-consent/:user_id
```

### User Endpoint (Includes AI Consent)

```bash
# Get all users with AI consent status
GET /operator/users
# Response includes ai_consent_status field
```

---

## Future Enhancements

### Planned Features:
- AI usage analytics dashboard
- Cost tracking per user/feature
- Bulk AI consent operations
- AI content quality metrics
- Usage pattern analysis
- Cost budget alerts

---

## Related Documentation

- [`AI_FEATURES.md`](./AI_FEATURES.md) - Complete AI features documentation
- [`AI_FEATURES_TROUBLESHOOTING.md`](./AI_FEATURES_TROUBLESHOOTING.md) - Troubleshooting guide
- [`AI_COST_OPTIMIZATION.md`](./AI_COST_OPTIMIZATION.md) - Cost optimization strategies
- [`API.md`](./API.md) - Complete API documentation

