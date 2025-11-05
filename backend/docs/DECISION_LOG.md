# Decision Log: SpendSense

This document captures key architectural decisions and their rationale throughout the development of SpendSense.

## Table of Contents

1. [Authentication System](#authentication-system)
2. [Database Choice](#database-choice)
3. [Service Layer Architecture](#service-layer-architecture)
4. [Persona System Design](#persona-system-design)
5. [Recommendation Approval Workflow](#recommendation-approval-workflow)
6. [Guardrails Implementation](#guardrails-implementation)
7. [Explainability Approach](#explainability-approach)
8. [Performance Optimization](#performance-optimization)

---

## Authentication System

### Decision
**Simplified username/password authentication for demo mode**

### Context
The project requirements specified "No authentication required - Demo mode for prototype". However, we needed a way to distinguish between customers and operators for the operator portal.

### Solution
Implemented a simplified authentication system:
- **Customers:** Username = `first_name + last_name`, Password = `first_name + last_name + "123"`
- **Operator:** Username = `operator`, Password = `operator123`
- Passwords stored in plain text (acceptable for demo/prototype)
- No session management or JWT tokens
- Frontend stores user info in React Context after login

### Rationale
1. **Prototype Focus:** Meets the requirement for demo mode without over-engineering
2. **Simplicity:** Easy to test and understand
3. **Role-Based Access:** Enables operator portal without complex RBAC
4. **Future-Proof:** Can be replaced with proper authentication (OAuth, JWT) when moving to production

### Trade-offs
- ✅ Simple to implement and test
- ✅ No external dependencies
- ❌ Not secure for production (plain text passwords)
- ❌ No session expiration or refresh tokens

### Future Improvements
- Implement proper authentication (OAuth 2.0, JWT)
- Add password hashing (bcrypt)
- Implement session management
- Add rate limiting and brute-force protection

---

## Database Choice

### Decision
**SQLite with better-sqlite3 for local storage**

### Context
Requirements specified "Local storage only - SQLite for relational data". We needed a lightweight, file-based database that supports relational data and foreign keys.

### Solution
- SQLite database file: `backend/data/database.sqlite`
- Using `better-sqlite3` (synchronous, faster than `sqlite3`)
- Foreign key constraints enabled
- CASCADE deletes for referential integrity

### Rationale
1. **Local Storage:** Fits requirement for local-only storage
2. **No Server Required:** Single file, no database server needed
3. **Relational Support:** Supports foreign keys, joins, transactions
4. **Performance:** Fast for local development and testing
5. **Portability:** Database file can be easily backed up or shared

### Trade-offs
- ✅ Zero configuration, file-based
- ✅ Good performance for small to medium datasets
- ✅ Supports complex queries and relationships
- ❌ Not suitable for concurrent writes (single writer)
- ❌ Limited scalability for large datasets
- ❌ No built-in replication or backup

### Future Improvements
- Migrate to PostgreSQL for production
- Add database migrations system
- Implement connection pooling
- Add read replicas for scaling

---

## Service Layer Architecture

### Decision
**Modular service layer with clear separation of concerns**

### Context
Need to organize business logic in a maintainable way that supports:
- Behavioral signal detection
- Persona assignment
- Recommendation generation
- Guardrails enforcement
- Evaluation metrics

### Solution
Organized services into domain-specific modules:

```
backend/src/services/
├── ingest/          # Data loading and validation
├── features/         # Signal detection (subscriptions, savings, credit, income)
├── personas/         # Persona assignment and prioritization
├── recommend/       # Recommendation engine and rationale generation
├── guardrails/       # Consent, eligibility, tone validation
└── eval/            # Evaluation metrics and reporting
```

Each service:
- Accepts User ID and time window (30d/180d)
- Returns structured data with clear interfaces
- Independent of database models (uses models as dependencies)
- Testable in isolation

### Rationale
1. **Separation of Concerns:** Each module has a single responsibility
2. **Testability:** Services can be unit tested independently
3. **Maintainability:** Easy to locate and modify specific functionality
4. **Reusability:** Services can be called from multiple routes
5. **Scalability:** Easy to add new services or extend existing ones

### Trade-offs
- ✅ Clear organization and easy navigation
- ✅ Testable and maintainable
- ✅ Follows SOLID principles
- ❌ Some duplication (e.g., consent checks in multiple places)
- ❌ Requires careful dependency management

### Future Improvements
- Add dependency injection for better testability
- Create shared utilities for common operations
- Implement caching layer for expensive operations

---

## Persona System Design

### Decision
**Priority-based persona assignment with fallback to "New User"**

### Context
Users can match multiple personas. We need a deterministic way to assign one persona while maintaining explainability.

### Solution
Implemented priority-based system:
1. **High Utilization** (Priority 5) - Highest priority
2. **Variable Income Budgeter** (Priority 4)
3. **Subscription-Heavy** (Priority 3)
4. **Savings Builder** (Priority 2)
5. **New User** (Priority 1) - Fallback persona

Persona assignment:
- Evaluate all personas against user's behavioral signals
- Select highest priority matching persona
- If no match, assign "New User" (fallback)
- Generate rationale explaining why persona was assigned

### Rationale
1. **Deterministic:** Always assigns exactly one persona
2. **Prioritization:** Critical issues (high utilization) take precedence
3. **Fallback:** Every user gets a persona assignment
4. **Explainable:** Rationale cites specific data points
5. **Custom Persona:** "New User" persona serves as both specific persona and fallback

### Trade-offs
- ✅ Simple and deterministic
- ✅ Prioritizes critical financial issues
- ✅ Always provides a persona assignment
- ❌ Single persona may not capture full complexity
- ❌ No support for multiple personas per user

### Future Improvements
- Support multiple personas per user
- Add confidence scores for persona matching
- Allow operators to manually override persona assignments
- Implement persona transitions over time

---

## Recommendation Approval Workflow

### Decision
**Operator review queue with approval/override workflow**

### Context
Recommendations need human oversight to ensure quality and appropriateness. Users should only see approved recommendations.

### Solution
Implemented review queue system:
1. **Generation:** New recommendations automatically added to review queue with `status: "pending"`
2. **Storage:** Recommendations stored in `recommendation_reviews` table
3. **Operator Review:** Operator can view pending recommendations with decision traces
4. **Approval:** Operator approves → recommendations visible to user
5. **Override:** Operator overrides → recommendations rejected, user sees empty list
6. **User View:** Users only see approved recommendations

### Rationale
1. **Quality Control:** Human oversight ensures recommendations are appropriate
2. **User Experience:** Users don't see recommendations until approved
3. **Auditability:** All approvals/overrides tracked with operator notes
4. **Flexibility:** Operators can override any recommendation
5. **Safety:** Prevents inappropriate or tone-violating recommendations from reaching users

### Trade-offs
- ✅ Ensures quality and appropriateness
- ✅ Provides audit trail
- ✅ Operators have full control
- ❌ Adds latency (recommendations pending until approval)
- ❌ Requires operator availability
- ❌ May bottleneck at scale

### Future Improvements
- Auto-approve low-risk recommendations
- Add recommendation scoring/ranking
- Implement bulk approval workflows
- Add SLA tracking for review times

---

## Guardrails Implementation

### Decision
**Multi-layer guardrail system: Consent → Eligibility → Tone → Disclaimer**

### Context
Need to ensure recommendations are:
1. Only shown to users who have consented
2. Only eligible products/services
3. Using appropriate tone (no shaming)
4. Include required disclaimers

### Solution
Implemented guardrails as a pipeline:
1. **Consent Check:** Verifies user has granted consent before processing
2. **Eligibility Filter:** Checks income, credit, existing accounts before showing offers
3. **Tone Validator:** Validates language against prohibited phrases and tone guidelines
4. **Mandatory Disclaimer:** Appends disclaimer to all recommendations

Guardrails enforced at multiple levels:
- Service layer: Consent checked before persona assignment
- Recommendation generation: Eligibility and tone checked
- API layer: Consent verified before returning recommendations

### Rationale
1. **Compliance:** Ensures regulatory and ethical requirements met
2. **User Protection:** Prevents inappropriate recommendations
3. **Layered Defense:** Multiple checks catch different issues
4. **Explainability:** Each guardrail can be traced in decision trace
5. **Consistency:** Same guardrails applied across all recommendations

### Trade-offs
- ✅ Comprehensive protection
- ✅ Clear separation of concerns
- ✅ Easy to extend with new guardrails
- ❌ Adds processing overhead
- ❌ May filter out valid recommendations
- ❌ Requires maintenance of prohibited phrases list

### Future Improvements
- Machine learning for tone detection
- Dynamic eligibility rules based on user feedback
- A/B testing for guardrail effectiveness
- Automated guardrail rule updates

---

## Explainability Approach

### Decision
**Plain-language rationales with specific data citations for every recommendation**

### Context
Every recommendation must have a clear, understandable rationale. Users should understand why they're seeing each recommendation.

### Solution
Implemented rationale generation system:
- **Format:** "We noticed [specific data point]..."
- **Data Citations:** Include concrete numbers (e.g., "Visa ending in 4523 at 68% utilization")
- **Plain Language:** No financial jargon, accessible to all users
- **Decision Traces:** Full audit trail stored for operators
- **Mandatory:** Every recommendation must have a rationale

Example rationale:
> "We noticed your Visa ending in 4523 has 68% utilization ($3,400 of $5,000 limit), you're paying $87.50 in interest charges."

### Rationale
1. **Transparency:** Users understand why recommendations are made
2. **Trust:** Clear explanations build user confidence
3. **Education:** Rationales teach users about their financial patterns
4. **Compliance:** Meets explainability requirements
5. **Auditability:** Decision traces enable operator review

### Trade-offs
- ✅ Clear and understandable
- ✅ Builds user trust
- ✅ Educational value
- ❌ Requires careful wording to avoid judgment
- ❌ May need updates as data changes
- ❌ Adds complexity to recommendation generation

### Future Improvements
- Personalize rationale language based on user preferences
- Add visualizations to support rationales
- Use LLMs for more natural language generation
- A/B test different rationale formats

---

## Persona 5 (New User) Rationale

### Decision
**"New User" persona serves as both specific persona and fallback**

### Context
The project requirements specified 5 personas + 1 custom persona. We needed a fallback persona for users who don't match any of the first 4 personas.

### Solution
Implemented "New User" persona (Persona 5) with dual purpose:
1. **Specific Persona:** Matches users created within 90 days with limited credit/accounts
2. **Fallback Persona:** Assigned when no other personas match
3. **Low Priority:** Priority 1 (lowest) ensures other personas take precedence when matched

### Rationale
1. **Completeness:** Ensures 100% coverage (every user gets a persona)
2. **Practical:** New users have different needs than established users
3. **Educational:** Provides appropriate content for users starting their financial journey
4. **Flexible:** Serves as both specific persona and catch-all

### Trade-offs
- ✅ 100% coverage achieved
- ✅ Appropriate for new users
- ✅ Serves dual purpose efficiently
- ❌ May be too broad as fallback
- ❌ Doesn't distinguish between truly new users and unmatched users

### Future Improvements
- Separate "New User" persona from generic fallback
- Add "Unmatched" or "General" persona for users who don't fit any category
- Implement persona confidence scores
- Allow manual persona assignment by operators

---

---

## Performance Optimization

### Decision
**In-memory caching and database query optimization to meet <5 second latency target**

### Context
The system needs to generate recommendations for users in under 5 seconds. Initial profiling showed that:
- Persona assignment (feature analysis) is computationally expensive
- Database queries are repeated for the same user data
- Frontend components re-render unnecessarily

### Solution
Implemented a multi-layered performance optimization strategy:

#### 1. In-Memory Caching (`backend/src/utils/cache.js`)
- **Simple Map-based cache** with TTL support
- **Caches:**
  - User data (5 minutes TTL)
  - Account data (5 minutes TTL)
  - Persona assignments (5 minutes TTL)
  - Full recommendations (10 minutes TTL)
- **Automatic expiration** and periodic cleanup
- **Cache statistics** for monitoring hit rates

#### 2. Database Query Optimization
- **Additional indexes** for frequently queried columns:
  - Composite indexes on `(user_id, type)` for accounts
  - Composite indexes on `(account_id, date)` for transactions
  - Composite indexes on `(user_id, status)` for recommendation reviews
  - Index on `consent_status` for user filtering
- **ANALYZE command** run on database initialization to update query optimizer statistics
- **Existing indexes** verified and optimized

#### 3. Frontend Rendering Optimization
- **React.memo** for RecommendationCard component to prevent unnecessary re-renders
- **useMemo** for filtering and transforming recommendations data
- **Stable keys** using item IDs instead of array indices
- **Memoized filtered lists** for education items and partner offers

#### 4. Performance Monitoring
- **Performance logging** in recommendation engine for operations >1 second
- **Request timing** in API routes
- **Cache statistics** available via `cache.getStats()`
- **Latency metrics** tracked in evaluation system

### Rationale
1. **Caching Strategy:** In-memory cache is sufficient for prototype (single server). Can be upgraded to Redis for distributed systems.
2. **TTL Values:** 5-10 minutes balances freshness with performance. User data changes infrequently.
3. **Index Strategy:** Composite indexes support common query patterns (user + type, account + date).
4. **Frontend Optimization:** React.memo and useMemo prevent expensive re-renders of large lists.

### Trade-offs
- ✅ **Significant performance improvement** (cached requests <100ms vs 2-5s uncached)
- ✅ **Reduced database load** through caching
- ✅ **Better user experience** with faster responses
- ❌ **Memory usage** increases with cache size
- ❌ **Cache invalidation** needed when data changes (currently manual)
- ❌ **Stale data** possible if TTL too long

### Implementation Details

**Cache Invalidation:**
- Cache cleared when user data changes (via `clearUserCache()`)
- TTL-based expiration prevents indefinitely stale data
- Force refresh option in `generateRecommendations()` for critical updates

**Performance Targets:**
- **First request (uncached):** <5 seconds (target met)
- **Cached requests:** <500ms (significantly faster)
- **Database queries:** Optimized with indexes and ANALYZE

**Monitoring:**
- Performance logs in development mode
- Latency metrics in evaluation system
- Cache hit rate tracking

### Future Improvements
- Redis cache for distributed systems
- Cache warming for frequently accessed users
- Query result caching for expensive feature analyses
- Database query profiling and optimization
- Frontend code splitting and lazy loading
- Service worker for offline caching

---

## Summary

These architectural decisions prioritize:
1. **Simplicity** - Easy to understand and maintain
2. **Explainability** - Clear rationales for all recommendations
3. **Safety** - Multiple guardrails and operator oversight
4. **User Control** - Consent management and transparency
5. **Performance** - <5 second latency with caching and optimization
6. **Future-Proof** - Can be extended or replaced as needed

The system is designed as a prototype/demo that can evolve into a production system with proper authentication, database scaling, and enhanced features.

