/**
 * Models index file
 * Exports all models for easy importing
 */

const User = require('./User');
const Account = require('./Account');
const Transaction = require('./Transaction');
const Liability = require('./Liability');
const Consent = require('./Consent');

module.exports = {
  User,
  Account,
  Transaction,
  Liability,
  Consent
};

