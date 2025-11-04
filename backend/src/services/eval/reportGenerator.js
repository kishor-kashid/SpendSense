/**
 * Report Generator Service
 * Generates evaluation reports in JSON and CSV formats
 */

const fs = require('fs');
const path = require('path');
const { calculateAllMetrics } = require('./metricsCalculator');
const User = require('../../models/User');
const RecommendationReview = require('../../models/RecommendationReview');

/**
 * Generate JSON metrics report
 * @param {Object} metrics - Metrics data from calculateAllMetrics
 * @param {string} outputPath - Output file path (optional)
 * @returns {string} Path to generated file
 */
function generateJSONReport(metrics, outputPath = null) {
  if (!outputPath) {
    const outputDir = path.join(__dirname, '../../../data/evaluation');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    outputPath = path.join(outputDir, 'metrics.json');
  }
  
  // Ensure directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2), 'utf8');
  return outputPath;
}

/**
 * Generate CSV metrics report
 * @param {Object} metrics - Metrics data from calculateAllMetrics
 * @param {string} outputPath - Output file path (optional)
 * @returns {string} Path to generated file
 */
function generateCSVReport(metrics, outputPath = null) {
  if (!outputPath) {
    const outputDir = path.join(__dirname, '../../../data/evaluation');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    outputPath = path.join(outputDir, 'metrics.csv');
  }
  
  // Ensure directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const lines = [];
  
  // Header
  lines.push('Metric,Value,Target,Meets Target,Description');
  
  // Coverage
  const coverage = metrics.metrics.coverage;
  lines.push(`Coverage,${coverage.coverage_percentage}%,${coverage.target}%,${coverage.meets_target ? 'Yes' : 'No'},"${coverage.description}"`);
  
  // Explainability
  const explainability = metrics.metrics.explainability;
  lines.push(`Explainability,${explainability.explainability_percentage}%,${explainability.target}%,${explainability.meets_target ? 'Yes' : 'No'},"${explainability.description}"`);
  
  // Latency
  const latency = metrics.metrics.latency;
  lines.push(`Latency,${latency.average_latency_seconds}s,${latency.target_seconds}s,${latency.meets_target ? 'Yes' : 'No'},"${latency.description}"`);
  
  // Auditability
  const auditability = metrics.metrics.auditability;
  lines.push(`Auditability,${auditability.auditability_percentage}%,${auditability.target}%,${auditability.meets_target ? 'Yes' : 'No'},"${auditability.description}"`);
  
  // Summary section
  lines.push('');
  lines.push('Summary');
  lines.push('Metric,Value');
  lines.push(`Overall Meets Target,${metrics.overall_meets_target ? 'Yes' : 'No'}`);
  lines.push(`Coverage,${metrics.summary.coverage_percentage}%`);
  lines.push(`Explainability,${metrics.summary.explainability_percentage}%`);
  lines.push(`Average Latency,${metrics.summary.average_latency_seconds}s`);
  lines.push(`Auditability,${metrics.summary.auditability_percentage}%`);
  
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  return outputPath;
}

/**
 * Generate summary report (Markdown format)
 * @param {Object} metrics - Metrics data from calculateAllMetrics
 * @param {string} outputPath - Output file path (optional)
 * @returns {string} Path to generated file
 */
function generateSummaryReport(metrics, outputPath = null) {
  if (!outputPath) {
    const outputDir = path.join(__dirname, '../../../data/evaluation');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    outputPath = path.join(outputDir, 'summary_report.md');
  }
  
  // Ensure directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const { coverage, explainability, latency, auditability } = metrics.metrics;
  
  const report = `# SpendSense Evaluation Summary Report

Generated: ${new Date(metrics.timestamp).toLocaleString()}

## Executive Summary

Overall System Status: **${metrics.overall_meets_target ? '✅ MEETS ALL TARGETS' : '⚠️ DOES NOT MEET ALL TARGETS'}**

This report evaluates the SpendSense system across four key metrics: coverage, explainability, latency, and auditability.

---

## Metrics Overview

### 1. Coverage
**Target:** 100% of users with assigned persona and ≥3 detected behaviors

- **Current:** ${coverage.coverage_percentage}%
- **Status:** ${coverage.meets_target ? '✅ Meets Target' : '❌ Below Target'}
- **Details:**
  - Total users evaluated: ${coverage.total_users}
  - Users with persona: ${coverage.users_with_persona}
  - Users with persona and ≥3 behaviors: ${coverage.users_with_persona_and_behaviors}

### 2. Explainability
**Target:** 100% of recommendations with plain-language rationales

- **Current:** ${explainability.explainability_percentage}%
- **Status:** ${explainability.meets_target ? '✅ Meets Target' : '❌ Below Target'}
- **Details:**
  - Total recommendations: ${explainability.total_recommendations}
  - Recommendations with rationales: ${explainability.recommendations_with_rationales}

### 3. Latency
**Target:** <5 seconds average recommendation generation time

- **Current:** ${latency.average_latency_seconds}s (${latency.average_latency_ms}ms)
- **Status:** ${latency.meets_target ? '✅ Meets Target' : '❌ Above Target'}
- **Details:**
  - Sample size: ${latency.sample_size} users
  - Min latency: ${latency.min_latency_ms}ms
  - Max latency: ${latency.max_latency_ms}ms

### 4. Auditability
**Target:** 100% of recommendations with decision traces

- **Current:** ${auditability.auditability_percentage}%
- **Status:** ${auditability.meets_target ? '✅ Meets Target' : '❌ Below Target'}
- **Details:**
  - Total recommendations: ${auditability.total_recommendations}
  - Recommendations with traces: ${auditability.recommendations_with_traces}

---

## Detailed Breakdown

### Coverage Analysis
The coverage metric measures the percentage of users who have both:
1. An assigned persona (based on behavioral signals)
2. At least 3 detected behavioral signals

**Current Performance:** ${coverage.coverage_percentage}% of users meet both criteria.

### Explainability Analysis
Every recommendation includes a plain-language rationale explaining why it was recommended. The explainability metric measures the percentage of recommendations that have valid rationales.

**Current Performance:** ${explainability.explainability_percentage}% of recommendations include rationales.

### Latency Analysis
Recommendation generation time is measured from the start of persona assignment to the completion of recommendation generation. This includes all feature detection, persona assignment, content selection, and rationale generation.

**Current Performance:** Average generation time is ${latency.average_latency_seconds}s, which is ${latency.meets_target ? 'within' : 'exceeds'} the 5-second target.

### Auditability Analysis
Decision traces provide a complete audit trail of how each recommendation was generated, including persona assignment logic, signal detection results, and content selection criteria.

**Current Performance:** ${auditability.auditability_percentage}% of recommendations include decision traces.

---

## Recommendations

${!metrics.overall_meets_target ? `
### Areas for Improvement

${!coverage.meets_target ? `- **Coverage:** Focus on improving behavioral signal detection to ensure all users with consent have ≥3 detected behaviors.\n` : ''}
${!explainability.meets_target ? `- **Explainability:** Ensure all recommendations include valid rationales. Review rationale generation logic.\n` : ''}
${!latency.meets_target ? `- **Latency:** Optimize recommendation generation performance. Consider caching or optimization strategies.\n` : ''}
${!auditability.meets_target ? `- **Auditability:** Ensure decision traces are captured for all recommendations.\n` : ''}
` : `
### All Targets Met ✅

The system is performing well across all metrics. Continue monitoring to maintain performance.
`}

---

## Technical Details

- **Calculation Time:** ${metrics.calculation_time_ms}ms
- **Report Generated:** ${new Date().toISOString()}
- **Evaluation Method:** Full system evaluation across all users with consent

---

*This report was automatically generated by the SpendSense evaluation system.*
`;

  fs.writeFileSync(outputPath, report, 'utf8');
  return outputPath;
}

/**
 * Export decision traces for all users
 * @param {string} outputDir - Output directory path (optional)
 * @returns {string} Path to output directory
 */
function exportDecisionTraces(outputDir = null) {
  if (!outputDir) {
    outputDir = path.join(__dirname, '../../../data/evaluation/decision_traces');
  }
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const allUsers = User.findAll();
  const tracesExported = [];
  
  for (const user of allUsers) {
    if (user.consent_status !== 'granted') {
      continue;
    }
    
    try {
      const { generateRecommendations } = require('../recommend/recommendationEngine');
      const recommendations = generateRecommendations(user.user_id);
      
      if (recommendations.decision_trace) {
        const traceData = {
          user_id: user.user_id,
          user_name: user.name,
          timestamp: recommendations.timestamp,
          decision_trace: recommendations.decision_trace,
          persona_rationale: recommendations.persona_rationale,
          assigned_persona: recommendations.assigned_persona
        };
        
        const tracePath = path.join(outputDir, `user_${user.user_id}_trace.json`);
        fs.writeFileSync(tracePath, JSON.stringify(traceData, null, 2), 'utf8');
        
        tracesExported.push({
          user_id: user.user_id,
          file_path: tracePath
        });
      }
    } catch (error) {
      // User doesn't have consent or recommendations can't be generated
      continue;
    }
  }
  
  return {
    output_directory: outputDir,
    traces_exported: tracesExported.length,
    files: tracesExported
  };
}

/**
 * Generate all reports (JSON, CSV, summary, and decision traces)
 * @param {Object} options - Options for report generation
 * @param {Array<number>} options.userIds - Array of user IDs to evaluate (optional)
 * @param {number} options.latencySampleSize - Sample size for latency calculation (optional)
 * @param {string} options.outputDir - Output directory (optional)
 * @returns {Object} Report generation results
 */
function generateAllReports(options = {}) {
  const { userIds = null, latencySampleSize = null, outputDir = null } = options;
  
  const baseOutputDir = outputDir || path.join(__dirname, '../../../data/evaluation');
  
  // Calculate all metrics
  const metrics = calculateAllMetrics({ userIds, latencySampleSize });
  
  // Generate reports
  const jsonPath = generateJSONReport(metrics, path.join(baseOutputDir, 'metrics.json'));
  const csvPath = generateCSVReport(metrics, path.join(baseOutputDir, 'metrics.csv'));
  const summaryPath = generateSummaryReport(metrics, path.join(baseOutputDir, 'summary_report.md'));
  const tracesResult = exportDecisionTraces(path.join(baseOutputDir, 'decision_traces'));
  
  return {
    success: true,
    output_directory: baseOutputDir,
    files_generated: {
      json: jsonPath,
      csv: csvPath,
      summary: summaryPath,
      decision_traces: tracesResult
    },
    metrics: metrics,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  generateJSONReport,
  generateCSVReport,
  generateSummaryReport,
  exportDecisionTraces,
  generateAllReports
};

