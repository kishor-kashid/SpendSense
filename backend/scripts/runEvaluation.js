/**
 * Full Evaluation Harness
 * Runs complete evaluation on all synthetic users and generates all reports
 */

const { initializeDatabase } = require('../src/config/database');
const { loadAllData } = require('../src/services/ingest/dataLoader');
const { generateAllReports } = require('../src/services/eval/reportGenerator');
const fs = require('fs');
const path = require('path');

async function runFullEvaluation() {
  console.log('='.repeat(80));
  console.log('SpendSense Full Evaluation Harness');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Step 1: Initialize database
    console.log('Step 1: Initializing database...');
    await initializeDatabase();
    console.log('✓ Database initialized\n');

    // Step 2: Load all synthetic data
    console.log('Step 2: Loading synthetic data...');
    const dataDir = path.join(__dirname, '../data/synthetic');
    
    // Check if synthetic data exists
    if (!fs.existsSync(dataDir)) {
      throw new Error(`Synthetic data directory not found: ${dataDir}`);
    }

    const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));
    const accounts = JSON.parse(fs.readFileSync(path.join(dataDir, 'accounts.json'), 'utf8'));
    const transactions = JSON.parse(fs.readFileSync(path.join(dataDir, 'transactions.json'), 'utf8'));
    const liabilities = JSON.parse(fs.readFileSync(path.join(dataDir, 'liabilities.json'), 'utf8'));

    const data = {
      users,
      accounts,
      transactions,
      liabilities
    };

    loadAllData(data);
    console.log(`✓ Loaded ${users.length} users, ${accounts.length} accounts, ${transactions.length} transactions, ${liabilities.length} liabilities\n`);

    // Step 3: Generate recommendations for all users (to populate decision traces)
    console.log('Step 3: Generating recommendations for all users...');
    const { generateRecommendations } = require('../src/services/recommend/recommendationEngine');
    const User = require('../src/models/User');
    
    const allUsers = User.findAll().filter(u => u.consent_status === 'granted');
    let generatedCount = 0;
    let errorCount = 0;

    for (const user of allUsers) {
      try {
        generateRecommendations(user.user_id, { forceRefresh: true });
        generatedCount++;
        if (generatedCount % 10 === 0) {
          process.stdout.write(`  Generated ${generatedCount}/${allUsers.length}...\r`);
        }
      } catch (error) {
        errorCount++;
        console.warn(`  Warning: Failed to generate recommendations for user ${user.user_id}: ${error.message}`);
      }
    }
    console.log(`✓ Generated recommendations for ${generatedCount} users (${errorCount} errors)\n`);

    // Step 4: Run full evaluation and generate reports
    console.log('Step 4: Calculating metrics and generating reports...');
    const result = generateAllReports({
      userIds: null, // Evaluate all users
      latencySampleSize: null // Measure latency for all users
    });

    console.log('✓ Evaluation complete!\n');
    console.log('='.repeat(80));
    console.log('EVALUATION RESULTS');
    console.log('='.repeat(80));
    console.log('');
    console.log('Overall Status:', result.metrics.overall_meets_target ? '✅ MEETS ALL TARGETS' : '⚠️ DOES NOT MEET ALL TARGETS');
    console.log('');
    console.log('Metrics Summary:');
    console.log(`  Coverage: ${result.metrics.metrics.coverage.coverage_percentage}% (Target: 100%)`);
    console.log(`  Explainability: ${result.metrics.metrics.explainability.explainability_percentage}% (Target: 100%)`);
    console.log(`  Latency: ${result.metrics.metrics.latency.average_latency_seconds}s (Target: <5s)`);
    console.log(`  Auditability: ${result.metrics.metrics.auditability.auditability_percentage}% (Target: 100%)`);
    console.log('');
    console.log('Files Generated:');
    console.log(`  JSON Report: ${result.files_generated.json}`);
    console.log(`  CSV Report: ${result.files_generated.csv}`);
    console.log(`  Summary Report: ${result.files_generated.summary}`);
    console.log(`  Decision Traces: ${result.files_generated.decision_traces.output_directory} (${result.files_generated.decision_traces.traces_exported} traces)`);
    console.log('');
    console.log('='.repeat(80));
    console.log('Evaluation completed successfully!');
    console.log('='.repeat(80));

    return result;
  } catch (error) {
    console.error('');
    console.error('='.repeat(80));
    console.error('EVALUATION FAILED');
    console.error('='.repeat(80));
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runFullEvaluation()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { runFullEvaluation };

