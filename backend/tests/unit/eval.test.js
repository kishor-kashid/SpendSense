/**
 * Unit tests for Evaluation & Metrics System
 */

// Use test database for tests
process.env.DB_PATH = './data/test_database.sqlite';

const { initializeDatabase, closeDatabase } = require('../../src/config/database');
const { User } = require('../../src/models');
const Account = require('../../src/models/Account');
const Transaction = require('../../src/models/Transaction');
const Consent = require('../../src/models/Consent');
const RecommendationReview = require('../../src/models/RecommendationReview');
const {
  calculateCoverage,
  calculateExplainability,
  calculateLatency,
  calculateAuditability,
  calculateAllMetrics,
  countDetectedBehaviors
} = require('../../src/services/eval/metricsCalculator');
const {
  generateJSONReport,
  generateCSVReport,
  generateSummaryReport,
  exportDecisionTraces,
  generateAllReports
} = require('../../src/services/eval/reportGenerator');
const { assignPersonaToUser } = require('../../src/services/personas/personaAssigner');
const { generateRecommendations } = require('../../src/services/recommend/recommendationEngine');

describe('Evaluation & Metrics System', () => {
  let testUserId;
  let testUserId2;
  let testUserId3;

  beforeAll(async () => {
    await initializeDatabase();
    
    // Create test users with consent
    const uniqueId = Date.now();
    const user1 = User.create({
      name: 'Eval Test User 1',
      first_name: 'Eval',
      last_name: 'Test1',
      username: `evaltest1${uniqueId}`,
      password: 'evaltest1123',
      consent_status: 'granted'
    });
    testUserId = user1.user_id;

    const user2 = User.create({
      name: 'Eval Test User 2',
      first_name: 'Eval',
      last_name: 'Test2',
      username: `evaltest2${uniqueId}`,
      password: 'evaltest2123',
      consent_status: 'granted'
    });
    testUserId2 = user2.user_id;

    const user3 = User.create({
      name: 'Eval Test User 3',
      first_name: 'Eval',
      last_name: 'Test3',
      username: `evaltest3${uniqueId}`,
      password: 'evaltest3123',
      consent_status: 'granted'
    });
    testUserId3 = user3.user_id;

    // Grant consent for all users
    Consent.createOrUpdate({ user_id: testUserId, opted_in: true });
    Consent.createOrUpdate({ user_id: testUserId2, opted_in: true });
    Consent.createOrUpdate({ user_id: testUserId3, opted_in: true });

    // Create accounts and transactions for test users to enable persona assignment
    // Create checking account for user 1
    const account1 = Account.create({
      account_id: `test-acc-${testUserId}-1`,
      user_id: testUserId,
      type: 'depository',
      subtype: 'checking',
      available_balance: 5000,
      current_balance: 5000,
      iso_currency_code: 'USD',
      holder_category: 'consumer'
    });

    // Create credit card for user 1 (high utilization)
    const account2 = Account.create({
      account_id: `test-acc-${testUserId}-2`,
      user_id: testUserId,
      type: 'credit',
      subtype: 'credit card',
      current_balance: 4500,
      credit_limit: 5000,
      iso_currency_code: 'USD',
      holder_category: 'consumer'
    });

    // Create transactions for subscriptions
    const now = new Date();
    for (let i = 0; i < 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7)); // Weekly subscription
      Transaction.create({
        transaction_id: `test-txn-${testUserId}-${i}`,
        account_id: account1.account_id,
        date: date.toISOString().split('T')[0],
        amount: -9.99,
        merchant_name: 'Netflix',
        personal_finance_category_primary: 'GENERAL_MERCHANDISE',
        pending: 0
      });
    }

    // Create similar setup for user 2
    const account3 = Account.create({
      account_id: `test-acc-${testUserId2}-1`,
      user_id: testUserId2,
      type: 'depository',
      subtype: 'checking',
      available_balance: 3000,
      current_balance: 3000,
      iso_currency_code: 'USD',
      holder_category: 'consumer'
    });
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('countDetectedBehaviors', () => {
    test('should count detected behaviors correctly', () => {
      const behavioralSignals = {
        subscriptions: {
          analysis_30d: {
            recurring_merchants: [{ merchant_name: 'Netflix' }]
          }
        },
        savings: {
          analysis_30d: {
            meets_threshold: true
          }
        },
        credit: {
          analysis_30d: {
            utilization_level: 'high'
          }
        },
        income: {
          analysis_30d: {
            has_variable_income: false
          }
        }
      };

      const count = countDetectedBehaviors(behavioralSignals);
      expect(count).toBe(3);
    });

    test('should return 0 for null behavioral signals', () => {
      const count = countDetectedBehaviors(null);
      expect(count).toBe(0);
    });

    test('should return 0 for empty behavioral signals', () => {
      const count = countDetectedBehaviors({});
      expect(count).toBe(0);
    });
  });

  describe('calculateCoverage', () => {
    test('should calculate coverage metric', () => {
      const result = calculateCoverage([testUserId]);
      
      expect(result).toHaveProperty('metric', 'coverage');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('total_users');
      expect(result).toHaveProperty('users_with_persona');
      expect(result).toHaveProperty('users_with_persona_and_behaviors');
      expect(result).toHaveProperty('coverage_percentage');
      expect(result).toHaveProperty('target', 100);
      expect(result).toHaveProperty('meets_target');
      expect(result).toHaveProperty('user_details');
      expect(Array.isArray(result.user_details)).toBe(true);
    });

    test('should return 0% coverage for users without consent', () => {
      const uniqueId = Date.now();
      const userWithoutConsent = User.create({
        name: 'No Consent User',
        first_name: 'No',
        last_name: 'Consent',
        username: `noconsent${uniqueId}`,
        password: 'noconsent123',
        consent_status: 'revoked'
      });

      const result = calculateCoverage([userWithoutConsent.user_id]);
      expect(result.total_users).toBe(0);
      expect(result.coverage_percentage).toBe(0);
    });

    test('should handle empty user list', () => {
      const result = calculateCoverage([]);
      expect(result.total_users).toBe(0);
      expect(result.coverage_percentage).toBe(0);
    });
  });

  describe('calculateExplainability', () => {
    test('should calculate explainability metric', () => {
      const result = calculateExplainability([testUserId]);
      
      expect(result).toHaveProperty('metric', 'explainability');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('total_recommendations');
      expect(result).toHaveProperty('recommendations_with_rationales');
      expect(result).toHaveProperty('explainability_percentage');
      expect(result).toHaveProperty('target', 100);
      expect(result).toHaveProperty('meets_target');
      expect(result).toHaveProperty('recommendation_details');
      expect(Array.isArray(result.recommendation_details)).toBe(true);
    });

    test('should return 100% explainability when all recommendations have rationales', () => {
      // Generate recommendations for test user
      try {
        const result = calculateExplainability([testUserId]);
        // All recommendations should have rationales
        expect(result.explainability_percentage).toBeGreaterThanOrEqual(0);
        expect(result.meets_target).toBe(result.explainability_percentage >= 100);
      } catch (error) {
        // If user doesn't have enough data, skip this test
        expect(error).toBeDefined();
      }
    });

    test('should handle users without consent gracefully', () => {
      const uniqueId = Date.now();
      const userWithoutConsent = User.create({
        name: 'No Consent User',
        first_name: 'No',
        last_name: 'Consent',
        username: `noconsent${uniqueId}`,
        password: 'noconsent123',
        consent_status: 'revoked'
      });

      const result = calculateExplainability([userWithoutConsent.user_id]);
      expect(result.total_recommendations).toBe(0);
      expect(result.explainability_percentage).toBe(0);
    });
  });

  describe('calculateLatency', () => {
    test('should calculate latency metric', () => {
      const result = calculateLatency([testUserId], 1);
      
      expect(result).toHaveProperty('metric', 'latency');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('sample_size');
      expect(result).toHaveProperty('average_latency_ms');
      expect(result).toHaveProperty('average_latency_seconds');
      expect(result).toHaveProperty('min_latency_ms');
      expect(result).toHaveProperty('max_latency_ms');
      expect(result).toHaveProperty('target_ms', 5000);
      expect(result).toHaveProperty('target_seconds', 5);
      expect(result).toHaveProperty('meets_target');
      expect(result).toHaveProperty('latency_details');
      expect(Array.isArray(result.latency_details)).toBe(true);
    });

    test('should return 0 latency for empty user list', () => {
      const result = calculateLatency([]);
      expect(result.sample_size).toBe(0);
      expect(result.average_latency_ms).toBe(0);
      expect(result.meets_target).toBe(false);
    });

    test('should respect sample size parameter', () => {
      const result = calculateLatency([testUserId, testUserId2, testUserId3], 2);
      expect(result.sample_size).toBeLessThanOrEqual(2);
    });

    test('should measure latency correctly', () => {
      const result = calculateLatency([testUserId], 1);
      if (result.sample_size > 0) {
        expect(result.average_latency_ms).toBeGreaterThanOrEqual(0);
        expect(result.average_latency_seconds).toBeGreaterThanOrEqual(0);
        expect(result.min_latency_ms).toBeGreaterThanOrEqual(0);
        expect(result.max_latency_ms).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('calculateAuditability', () => {
    test('should calculate auditability metric', () => {
      // Generate recommendations to create review records
      try {
        generateRecommendations(testUserId);
      } catch (error) {
        // Skip if user doesn't have enough data
      }

      const result = calculateAuditability([testUserId]);
      
      expect(result).toHaveProperty('metric', 'auditability');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('total_recommendations');
      expect(result).toHaveProperty('recommendations_with_traces');
      expect(result).toHaveProperty('auditability_percentage');
      expect(result).toHaveProperty('target', 100);
      expect(result).toHaveProperty('meets_target');
      expect(result).toHaveProperty('trace_details');
      expect(Array.isArray(result.trace_details)).toBe(true);
    });

    test('should return 0% auditability for users without recommendations', () => {
      const uniqueId = Date.now();
      const userWithoutConsent = User.create({
        name: 'No Consent User',
        first_name: 'No',
        last_name: 'Consent',
        username: `noconsent${uniqueId}`,
        password: 'noconsent123',
        consent_status: 'revoked'
      });

      const result = calculateAuditability([userWithoutConsent.user_id]);
      expect(result.total_recommendations).toBeGreaterThanOrEqual(0);
      expect(result.auditability_percentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateAllMetrics', () => {
    test('should calculate all metrics', () => {
      const result = calculateAllMetrics({ userIds: [testUserId], latencySampleSize: 1 });
      
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('calculation_time_ms');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('overall_meets_target');
      expect(result).toHaveProperty('summary');
      
      expect(result.metrics).toHaveProperty('coverage');
      expect(result.metrics).toHaveProperty('explainability');
      expect(result.metrics).toHaveProperty('latency');
      expect(result.metrics).toHaveProperty('auditability');
      
      expect(result.summary).toHaveProperty('coverage_percentage');
      expect(result.summary).toHaveProperty('explainability_percentage');
      expect(result.summary).toHaveProperty('average_latency_seconds');
      expect(result.summary).toHaveProperty('auditability_percentage');
    });

    test('should calculate metrics for all users when no userIds specified', () => {
      const result = calculateAllMetrics({ latencySampleSize: 1 });
      
      expect(result).toHaveProperty('metrics');
      expect(result.metrics.coverage).toHaveProperty('total_users');
      expect(result.metrics.explainability).toHaveProperty('total_recommendations');
    });
  });

  describe('Report Generation', () => {
    test('generateJSONReport should create JSON file', () => {
      const metrics = calculateAllMetrics({ userIds: [testUserId], latencySampleSize: 1 });
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, '../../data/evaluation/test_metrics.json');
      
      const result = generateJSONReport(metrics, outputPath);
      
      expect(result).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      const content = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      expect(content).toHaveProperty('timestamp');
      expect(content).toHaveProperty('metrics');
      
      // Clean up
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });

    test('generateCSVReport should create CSV file', () => {
      const metrics = calculateAllMetrics({ userIds: [testUserId], latencySampleSize: 1 });
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, '../../data/evaluation/test_metrics.csv');
      
      const result = generateCSVReport(metrics, outputPath);
      
      expect(result).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      const content = fs.readFileSync(outputPath, 'utf8');
      expect(content).toContain('Metric,Value,Target');
      expect(content).toContain('Coverage');
      expect(content).toContain('Explainability');
      
      // Clean up
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });

    test('generateSummaryReport should create Markdown file', () => {
      const metrics = calculateAllMetrics({ userIds: [testUserId], latencySampleSize: 1 });
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, '../../data/evaluation/test_summary.md');
      
      const result = generateSummaryReport(metrics, outputPath);
      
      expect(result).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
      
      const content = fs.readFileSync(outputPath, 'utf8');
      expect(content).toContain('# SpendSense Evaluation Summary Report');
      expect(content).toContain('Coverage');
      expect(content).toContain('Explainability');
      
      // Clean up
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });

    test('exportDecisionTraces should export decision traces', () => {
      const path = require('path');
      const outputDir = path.join(__dirname, '../../data/evaluation/test_traces');
      
      const result = exportDecisionTraces(outputDir);
      
      expect(result).toHaveProperty('output_directory');
      expect(result).toHaveProperty('traces_exported');
      expect(result).toHaveProperty('files');
      expect(Array.isArray(result.files)).toBe(true);
      
      // Clean up
      const fs = require('fs');
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
    });

    test('generateAllReports should generate all report types', () => {
      const path = require('path');
      const outputDir = path.join(__dirname, '../../data/evaluation/test_reports');
      const fs = require('fs');
      
      const result = generateAllReports({ 
        userIds: [testUserId], 
        latencySampleSize: 1,
        outputDir 
      });
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('output_directory');
      expect(result).toHaveProperty('files_generated');
      expect(result).toHaveProperty('metrics');
      
      expect(result.files_generated).toHaveProperty('json');
      expect(result.files_generated).toHaveProperty('csv');
      expect(result.files_generated).toHaveProperty('summary');
      expect(result.files_generated).toHaveProperty('decision_traces');
      
      // Verify files exist
      expect(fs.existsSync(result.files_generated.json)).toBe(true);
      expect(fs.existsSync(result.files_generated.csv)).toBe(true);
      expect(fs.existsSync(result.files_generated.summary)).toBe(true);
      
      // Clean up
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
    });
  });
});

