# Database Schema Documentation

## Overview

SpendSense uses SQLite for local storage. The database schema consists of 5 main tables with foreign key relationships to maintain data integrity.

## Entity Relationship Diagram

```
users (1) ──→ (N) accounts
accounts (1) ──→ (N) transactions
accounts (1) ──→ (0-1) liabilities
users (1) ──→ (1) consent
```

## Tables

### 1. users

Stores user information, authentication credentials, and consent status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique user identifier |
| `first_name` | TEXT | NOT NULL | User's first name |
| `last_name` | TEXT | NOT NULL | User's last name |
| `name` | TEXT | NOT NULL | User's full name |
| `username` | TEXT | NOT NULL, UNIQUE | Username for authentication |
| `password` | TEXT | NOT NULL | Password for authentication (plain text in demo) |
| `consent_status` | TEXT | NOT NULL, DEFAULT 'revoked', CHECK | Consent status: 'granted', 'revoked' |
| `created_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Account creation timestamp |
| `updated_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Last update timestamp |

**Indexes:**
- Primary key on `user_id`
- Unique index on `username`

**Relationships:**
- One-to-many with `accounts` (ON DELETE CASCADE)
- One-to-one with `consent` (ON DELETE CASCADE)
- One-to-many with `feedback` (ON DELETE CASCADE)
- One-to-many with `recommendation_reviews` (ON DELETE CASCADE)

**Notes:**
- Username format: `first_name + last_name` (e.g., "JohnDoe")
- Password format: `first_name + last_name + "123"` (e.g., "JohnDoe123")
- Passwords are stored in plain text (acceptable for demo/prototype only)

---

### 2. accounts

Stores financial account information (checking, savings, credit cards, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `account_id` | TEXT | PRIMARY KEY | Unique account identifier (Plaid-style) |
| `user_id` | INTEGER | NOT NULL, FOREIGN KEY | Reference to users.user_id |
| `type` | TEXT | NOT NULL, CHECK | Account type: 'depository', 'credit', 'loan', 'investment', 'other' |
| `subtype` | TEXT | | Account subtype (e.g., 'checking', 'savings', 'credit card') |
| `available_balance` | REAL | | Available balance |
| `current_balance` | REAL | | Current balance |
| `credit_limit` | REAL | | Credit limit (for credit accounts) |
| `iso_currency_code` | TEXT | NOT NULL, DEFAULT 'USD' | ISO 4217 currency code |
| `holder_category` | TEXT | NOT NULL, DEFAULT 'consumer', CHECK | Account holder: 'consumer' or 'business' |
| `created_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Account creation timestamp |
| `updated_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Last update timestamp |

**Indexes:**
- Primary key on `account_id`
- Index on `user_id` (idx_accounts_user_id)
- Index on `type` (idx_accounts_type)

**Relationships:**
- Many-to-one with `users` (ON DELETE CASCADE)
- One-to-many with `transactions` (ON DELETE CASCADE)
- One-to-one with `liabilities` (ON DELETE CASCADE)

**Common Subtypes:**
- **Depository:** checking, savings, money market, hsa, cash management
- **Credit:** credit card
- **Loan:** mortgage, student loan, auto loan

---

### 3. transactions

Stores individual financial transactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `transaction_id` | TEXT | PRIMARY KEY | Unique transaction identifier (Plaid-style) |
| `account_id` | TEXT | NOT NULL, FOREIGN KEY | Reference to accounts.account_id |
| `date` | TEXT | NOT NULL | Transaction date (YYYY-MM-DD format) |
| `amount` | REAL | NOT NULL | Transaction amount (negative for debits, positive for credits) |
| `merchant_name` | TEXT | | Merchant name |
| `merchant_entity_id` | TEXT | | Merchant entity ID (Plaid) |
| `payment_channel` | TEXT | | Payment channel (e.g., 'online', 'in store', 'other') |
| `personal_finance_category_primary` | TEXT | | Primary finance category |
| `personal_finance_category_detailed` | TEXT | | Detailed finance category |
| `pending` | INTEGER | NOT NULL, DEFAULT 0, CHECK | Pending status: 0 (false) or 1 (true) |
| `created_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Record creation timestamp |

**Indexes:**
- Primary key on `transaction_id`
- Index on `account_id` (idx_transactions_account_id)
- Index on `date` (idx_transactions_date)
- Index on `merchant_name` (idx_transactions_merchant)
- Index on `pending` (idx_transactions_pending)

**Relationships:**
- Many-to-one with `accounts` (ON DELETE CASCADE)

**Notes:**
- Amount is stored as REAL (decimal). Negative values represent debits/expenses, positive values represent credits/income.
- Date format: YYYY-MM-DD (ISO 8601)

---

### 4. liabilities

Stores credit card, mortgage, and loan liability information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `liability_id` | TEXT | PRIMARY KEY | Unique liability identifier |
| `account_id` | TEXT | NOT NULL, UNIQUE, FOREIGN KEY | Reference to accounts.account_id (one-to-one) |
| `apr_type` | TEXT | | APR type (e.g., 'purchase', 'balance_transfer') |
| `apr_percentage` | REAL | | APR percentage (annual percentage rate) |
| `interest_rate` | REAL | | Interest rate (for mortgages/loans) |
| `minimum_payment_amount` | REAL | | Minimum payment amount |
| `last_payment_amount` | REAL | | Last payment amount made |
| `is_overdue` | INTEGER | NOT NULL, DEFAULT 0, CHECK | Overdue status: 0 (false) or 1 (true) |
| `next_payment_due_date` | TEXT | | Next payment due date (YYYY-MM-DD) |
| `last_statement_balance` | REAL | | Last statement balance |
| `created_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Record creation timestamp |
| `updated_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Last update timestamp |

**Indexes:**
- Primary key on `liability_id`
- Unique constraint on `account_id`
- Index on `account_id` (idx_liabilities_account_id)
- Index on `is_overdue` (idx_liabilities_overdue)

**Relationships:**
- One-to-one with `accounts` (ON DELETE CASCADE)

**Notes:**
- For credit cards: Use `apr_percentage` and `apr_type`
- For mortgages/loans: Use `interest_rate`
- Each account can have at most one liability record

---

### 5. consent

Tracks user consent for data processing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `consent_id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique consent identifier |
| `user_id` | INTEGER | NOT NULL, UNIQUE, FOREIGN KEY | Reference to users.user_id |
| `opted_in` | INTEGER | NOT NULL, DEFAULT 0, CHECK | Consent status: 0 (false/opted-out) or 1 (true/opted-in) |
| `timestamp` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Consent timestamp (when consent was granted/revoked) |

**Indexes:**
- Primary key on `consent_id`
- Unique constraint on `user_id`
- Index on `user_id` (idx_consent_user_id)

**Relationships:**
- One-to-one with `users` (ON DELETE CASCADE)

**Notes:**
- Each user can have only one consent record (latest consent status)
- Timestamp tracks when consent was last updated
- For audit trail, consider creating a separate `consent_history` table in the future

---

### 6. ai_consent

Tracks user consent for AI-powered features. Separate from data processing consent - users can opt into data processing but not AI features, or vice versa.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `ai_consent_id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique AI consent identifier |
| `user_id` | INTEGER | NOT NULL, UNIQUE, FOREIGN KEY | Reference to users.user_id |
| `opted_in` | INTEGER | NOT NULL, DEFAULT 0, CHECK | AI consent status: 0 (false/opted-out) or 1 (true/opted-in) |
| `timestamp` | TEXT | NOT NULL, DEFAULT (datetime('now')) | AI consent timestamp (when consent was granted/revoked) |

**Indexes:**
- Primary key on `ai_consent_id`
- Unique constraint on `user_id`
- Index on `user_id` (idx_ai_consent_user_id)

**Relationships:**
- One-to-one with `users` (ON DELETE CASCADE)

**Notes:**
- Each user can have only one AI consent record (latest consent status)
- Timestamp tracks when AI consent was last updated
- AI consent is independent of data processing consent
- AI features require AI consent only (independent of data processing consent)
- Data processing consent is required for behavioral analysis and recommendations
- AI features can work independently when AI consent is granted
- For audit trail, consider creating a separate `ai_consent_history` table in the future

---

### 7. feedback

Stores user feedback on recommendations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `feedback_id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique feedback identifier |
| `user_id` | INTEGER | NOT NULL, FOREIGN KEY | Reference to users.user_id |
| `recommendation_id` | TEXT | | Recommendation ID (optional) |
| `recommendation_type` | TEXT | CHECK | Type: 'education' or 'offer' |
| `rating` | INTEGER | CHECK | Rating 1-5 (optional) |
| `comment` | TEXT | | Text feedback (optional) |
| `helpful` | INTEGER | CHECK | Helpful flag: 0 (false) or 1 (true) |
| `created_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Feedback creation timestamp |

**Indexes:**
- Primary key on `feedback_id`
- Index on `user_id` (idx_feedback_user_id)

**Relationships:**
- Many-to-one with `users` (ON DELETE CASCADE)

**Notes:**
- All feedback fields except `user_id` are optional
- Feedback can be general (no recommendation_id) or specific to a recommendation

---

### 7. recommendation_reviews

Stores recommendations pending operator review and approval history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `review_id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique review identifier |
| `user_id` | INTEGER | NOT NULL, FOREIGN KEY | Reference to users.user_id |
| `recommendation_data` | TEXT | NOT NULL | JSON string of recommendation data (education items + partner offers) |
| `status` | TEXT | NOT NULL, DEFAULT 'pending', CHECK | Status: 'pending', 'approved', 'overridden' |
| `operator_notes` | TEXT | | Notes from operator review (optional) |
| `decision_trace` | TEXT | | JSON string of decision trace for auditability |
| `created_at` | TEXT | NOT NULL, DEFAULT (datetime('now')) | Review creation timestamp |
| `reviewed_at` | TEXT | | Timestamp when reviewed (null if pending) |
| `reviewed_by` | TEXT | | Username of operator who reviewed (null if pending) |

**Indexes:**
- Primary key on `review_id`
- Index on `user_id` (idx_recommendation_reviews_user_id)
- Index on `status` (idx_recommendation_reviews_status)

**Relationships:**
- Many-to-one with `users` (ON DELETE CASCADE)

**Notes:**
- New recommendations are automatically added with `status: 'pending'`
- Users can only see recommendations after operator approval (`status: 'approved'`)
- Operators can override recommendations (`status: 'overridden'`)
- `recommendation_data` and `decision_trace` are stored as JSON strings
- Only one pending review per user (new recommendations update existing pending review)

---

## Foreign Key Relationships

All foreign key relationships use `ON DELETE CASCADE`:
- Deleting a user deletes all associated accounts, transactions, liabilities, and consent
- Deleting an account deletes all associated transactions and liabilities
- This ensures referential integrity

## Data Types

- **INTEGER:** Whole numbers (auto-increment IDs, boolean flags)
- **TEXT:** Strings and dates (ISO 8601 format: YYYY-MM-DD)
- **REAL:** Decimal numbers (balances, amounts, percentages)

## Indexes

Indexes are created on frequently queried columns:
- Foreign keys (user_id, account_id)
- Date columns (for time-range queries)
- Status flags (pending, is_overdue)
- Merchant names (for subscription detection)

## Migration Scripts

Migrations are located in `backend/src/migrations/createTables.js`:
- `createTables()` - Creates all tables and indexes
- `dropTables()` - Drops all tables (use with caution)

Migrations run automatically when the database is initialized.

## Usage Examples

### Create a user
```javascript
const User = require('./models/User');
const user = User.create({ name: 'John Doe', consent_status: 'pending' });
```

### Create an account
```javascript
const Account = require('./models/Account');
const account = Account.create({
  account_id: 'acc_123',
  user_id: 1,
  type: 'depository',
  subtype: 'checking',
  available_balance: 5000.00,
  current_balance: 5000.00
});
```

### Query transactions
```javascript
const Transaction = require('./models/Transaction');
const transactions = Transaction.findByAccountId('acc_123', {
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  includePending: false
});
```

## Additional Tables

### Summary of All Tables

1. **users** - User accounts and authentication
2. **accounts** - Financial accounts (checking, savings, credit cards, loans)
3. **transactions** - Individual financial transactions
4. **liabilities** - Credit card and loan liability details
5. **consent** - User consent records for data processing
6. **feedback** - User feedback on recommendations
7. **recommendation_reviews** - Operator review queue for recommendations

## Schema Version

Current schema version: **2.0.0**

Last updated: PR #28 - Added username/password fields, feedback table, and recommendation_reviews table

### Migration History

- **v1.0.0** (PR #2): Initial schema with users, accounts, transactions, liabilities, consent
- **v2.0.0** (PR #28): Added username/password fields, feedback table, recommendation_reviews table

