# AI Features Troubleshooting Guide

## Common Issues and Solutions

### Issue: AI Features Not Working

**Symptoms:**
- AI features return 403 Forbidden
- Error message: "AI consent is required"
- Features don't load

**Solutions:**
1. **Check AI Consent:**
   - Navigate to user profile menu
   - Ensure "AI Features Consent" toggle is ON
   - If toggled off, turn it on and refresh the page

2. **Verify OpenAI Configuration:**
   ```bash
   # Check if OPENAI_API_KEY is set
   echo $OPENAI_API_KEY
   
   # Or check backend/.env file
   cat backend/.env | grep OPENAI
   ```

3. **Test OpenAI Connection:**
   ```bash
   # Check backend logs for OpenAI errors
   # Look for "OpenAI API is not configured" messages
   ```

---

### Issue: "OpenAI API is not configured"

**Symptoms:**
- Error: "OpenAI API is not configured"
- Features return 500 error

**Solutions:**
1. **Set API Key:**
   ```bash
   # In backend/.env or environment variables
   export OPENAI_API_KEY=sk-your-api-key-here
   ```

2. **Restart Backend:**
   ```bash
   cd backend
   npm start
   ```

3. **Verify Configuration:**
   - Check `backend/src/services/ai/openaiClient.js`
   - Ensure `isConfigured()` returns true

---

### Issue: AI Features Return 403 Despite Consent Granted

**Symptoms:**
- AI consent toggle is ON
- Still getting 403 errors
- Features don't load

**Solutions:**
1. **Check Consent Status:**
   ```bash
   # Check database directly
   sqlite3 backend/data/database.sqlite
   SELECT * FROM ai_consent WHERE user_id = 1;
   ```

2. **Refresh Consent:**
   - Toggle AI consent OFF, then ON again
   - Refresh the page

3. **Clear Browser Cache:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear browser cache

4. **Check Backend Logs:**
   ```bash
   # Look for consent check errors
   # Verify aiConsentChecker.js is working correctly
   ```

---

### Issue: AI Responses Are Slow

**Symptoms:**
- Long wait times for AI features
- Timeout errors
- Poor user experience

**Solutions:**
1. **Check Cache:**
   - Verify caching is working
   - Check cache hit rates in logs

2. **Check OpenAI Status:**
   - Visit https://status.openai.com
   - Check for API outages

3. **Reduce Cache TTL (if needed):**
   - Edit cache durations in `backend/src/services/ai/utils.js`
   - Reduce TTL for faster updates (but higher costs)

4. **Check Rate Limiting:**
   - Verify you're not hitting rate limits
   - Check `rateLimiter` in utils.js

---

### Issue: AI Responses Are Inaccurate or Irrelevant

**Symptoms:**
- Predictions don't match user data
- Budgets are unrealistic
- Suggestions don't make sense

**Solutions:**
1. **Check User Data:**
   - Verify user has sufficient transaction history
   - Check data quality in database

2. **Verify Prompt Data:**
   - Check what data is being sent to AI
   - Look at sanitized data in logs

3. **Review Prompts:**
   - Check `backend/src/services/ai/promptTemplates.js`
   - Ensure prompts include relevant context

4. **Validate Output:**
   - Check AI response structure
   - Verify JSON parsing is correct

---

### Issue: High API Costs

**Symptoms:**
- Unexpected OpenAI API costs
- High monthly bills

**Solutions:**
1. **Check Cache Hit Rates:**
   - Monitor cache effectiveness
   - Increase cache durations if needed

2. **Review Rate Limiting:**
   - Ensure rate limits are properly configured
   - Check for abuse or errors causing excessive calls

3. **Optimize Data Sanitization:**
   - Verify data sanitization is working
   - Reduce token count in prompts

4. **Monitor Usage:**
   - Track API calls per user
   - Identify high-usage patterns

5. **Consider Model Selection:**
   - Use GPT-3.5-turbo for simpler tasks (future)
   - Reserve GPT-4 for complex reasoning

---

### Issue: Rate Limit Errors (429)

**Symptoms:**
- Error: "Rate limit exceeded"
- "AI service is temporarily unavailable"

**Solutions:**
1. **Wait and Retry:**
   - Rate limits reset after the window period
   - Wait and try again

2. **Check Rate Limit Settings:**
   - Review `checkRateLimit()` in utils.js
   - Adjust limits if needed

3. **Check OpenAI Limits:**
   - Verify OpenAI account limits
   - Check for account-level rate limits

4. **Implement Exponential Backoff:**
   - Add retry logic with backoff
   - Handle rate limits gracefully

---

### Issue: AI Consent Not Persisting

**Symptoms:**
- Consent toggle resets after page refresh
- Consent status not saved

**Solutions:**
1. **Check Database:**
   ```bash
   sqlite3 backend/data/database.sqlite
   SELECT * FROM ai_consent WHERE user_id = 1;
   ```

2. **Check API Response:**
   ```bash
   # Test consent endpoint
   curl -X POST http://localhost:3001/ai-consent \
     -H "Content-Type: application/json" \
     -d '{"user_id": 1}'
   ```

3. **Clear Browser Cache:**
   - Clear localStorage
   - Hard refresh page

4. **Check Frontend Hook:**
   - Verify `useAIConsent` hook is working
   - Check for JavaScript errors in console

---

### Issue: Subscription Analysis Shows Wrong Values

**Symptoms:**
- Monthly subscription costs are incorrect
- Cost per use calculations are wrong
- Value scores don't make sense

**Solutions:**
1. **Check Transaction Data:**
   - Verify transactions exist for the merchant
   - Check transaction amounts are correct

2. **Review Calculation Logic:**
   - Check `calculateSubscriptionValue()` in subscriptionAnalyzer.js
   - Verify monthly spend calculation

3. **Check Cache:**
   - Clear cache for subscription analysis
   - Force regeneration

4. **Verify Data Filtering:**
   - Ensure transactions are filtered correctly
   - Check date range calculations

---

### Issue: Budget/Goal Generation Returns "Insufficient Data"

**Symptoms:**
- Error: "Not enough transaction history"
- Budget/goals don't generate

**Solutions:**
1. **Check Transaction History:**
   - User needs at least 90 days of transaction history
   - Verify transactions exist in database

2. **Generate More Data:**
   ```bash
   cd backend
   npm run generate-data 10 180  # Generate 10 users with 180 days
   ```

3. **Check Data Quality:**
   - Verify transactions have valid dates
   - Check transaction amounts are not null

4. **Review Requirements:**
   - Budgets require ≥90 days of history
   - Goals require ≥90 days of history
   - At least 10 transactions needed

---

### Issue: AI Responses Are Too Generic

**Symptoms:**
- Responses don't cite specific data
- Rationales are vague
- Predictions don't reference user patterns

**Solutions:**
1. **Check Data Sanitization:**
   - Verify data is being sent correctly
   - Check prompt includes user data

2. **Review Prompts:**
   - Ensure prompts request specific data citations
   - Check prompt examples in AI_PROMPTS.md

3. **Validate Input:**
   - Verify behavioral signals are available
   - Check persona assignment is correct

---

### Issue: Cache Not Working

**Symptoms:**
- Every request calls OpenAI API
- High API costs
- Slow responses

**Solutions:**
1. **Check Cache Implementation:**
   ```javascript
   // Verify cache is being used
   const cache = require('./utils/cache');
   console.log(cache.get('test-key'));
   ```

2. **Check Cache Keys:**
   - Verify cache keys are consistent
   - Check for key collisions

3. **Clear and Test:**
   ```javascript
   // Clear cache and test
   cache.clear();
   // Make request, verify cache is set
   ```

4. **Check TTL:**
   - Verify TTL values are set correctly
   - Check cache expiration logic

---

### Issue: AI Output Validation Fails

**Symptoms:**
- JSON parsing errors
- Invalid response structure
- Missing required fields

**Solutions:**
1. **Check Response Format:**
   - Verify AI returns valid JSON
   - Check for markdown code blocks

2. **Review Parsing Logic:**
   ```javascript
   // Check JSON parsing with fallback
   try {
     return JSON.parse(content);
   } catch (error) {
     // Try extracting from markdown
     const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
     if (jsonMatch) return JSON.parse(jsonMatch[1]);
   }
   ```

3. **Add Validation:**
   - Validate response structure
   - Check required fields exist
   - Provide fallback values

---

## Debugging Tips

### Enable Debug Logging

```javascript
// In backend/src/services/ai/utils.js
const DEBUG = true;

if (DEBUG) {
  console.log('AI Request:', {
    feature: 'rationale',
    userId,
    cacheKey,
    tokens: estimatedTokens
  });
}
```

### Check API Response

```bash
# Test AI endpoint directly
curl -X GET http://localhost:3001/ai/predictions/1?horizon=30 \
  -H "Authorization: Bearer token"
```

### Verify Database State

```bash
# Check AI consent
sqlite3 backend/data/database.sqlite
SELECT * FROM ai_consent;

# Check user data
SELECT user_id, name FROM users WHERE user_id = 1;
```

### Monitor Network Requests

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "ai" or "predictions"
4. Check request/response details

---

## Getting Help

If issues persist:

1. **Check Logs:**
   - Backend console logs
   - Browser console errors
   - Network tab errors

2. **Verify Configuration:**
   - Environment variables
   - Database state
   - API keys

3. **Test Components:**
   - Test AI consent endpoints
   - Test OpenAI connection
   - Test cache functionality

4. **Review Documentation:**
   - [`AI_FEATURES.md`](./AI_FEATURES.md)
   - [`AI_PROMPTS.md`](./AI_PROMPTS.md)
   - [`API.md`](./API.md)

---

## Related Documentation

- [`AI_FEATURES.md`](./AI_FEATURES.md) - AI features overview
- [`AI_COST_OPTIMIZATION.md`](./AI_COST_OPTIMIZATION.md) - Cost optimization
- [`API.md`](./API.md) - API documentation

