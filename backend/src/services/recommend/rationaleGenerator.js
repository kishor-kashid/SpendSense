/**
 * Rationale Generator Service
 * Generates plain-language explanations for recommendations citing specific data
 */

const Account = require('../../models/Account');

/**
 * Generate rationale for an education item
 * @param {Object} item - Education item
 * @param {Object} persona - Assigned persona
 * @param {Object} behavioralSignals - Behavioral analysis results
 * @param {Object} userData - User data and accounts
 * @returns {string} Plain-language rationale
 */
function generateEducationRationale(item, persona, behavioralSignals, userData) {
  const { credit, income, subscriptions, savings } = behavioralSignals;
  
  // Base rationale template
  let rationale = `Based on your ${persona.name} profile, `;
  
  // Add specific data points based on recommendation type
  if (item.recommendation_types) {
    const types = item.recommendation_types;
    
    // Debt paydown rationale
    if (types.includes('debt_paydown') && credit?.short_term) {
      const creditData = credit.short_term;
      if (creditData.cards && creditData.cards.length > 0) {
        const highUtilCard = creditData.cards.find(c => c.utilization_level === 'high' || c.utilization_level === 'very_high');
        if (highUtilCard) {
          const account = Account.findById(highUtilCard.account_id);
          const cardEnding = account?.account_id ? account.account_id.slice(-4) : 'card';
          rationale += `we noticed your ${cardEnding} card is at ${Math.round(highUtilCard.utilization_percentage)}% utilization ($${Math.round(highUtilCard.balance).toLocaleString()} of $${Math.round(highUtilCard.limit).toLocaleString()} limit). `;
          rationale += `This resource can help you develop a strategy to pay down your debt and reduce interest charges.`;
          return rationale;
        }
      }
      
      // General debt paydown
      if (creditData.has_high_utilization || creditData.has_overdue) {
        rationale += `you're managing credit card debt. This guide will help you create an effective debt paydown strategy.`;
        return rationale;
      }
    }
    
    // Credit building rationale
    if (types.includes('credit_building')) {
      if (credit?.short_term && credit.short_term.credit_card_count === 0) {
        rationale += `you're new to credit. This resource will help you understand how to build credit responsibly.`;
        return rationale;
      }
      if (credit?.short_term && credit.short_term.has_high_utilization) {
        rationale += `improving your credit utilization can boost your credit score. This guide explains the fundamentals.`;
        return rationale;
      }
      rationale += `building strong credit habits is important for your financial future.`;
      return rationale;
    }
    
    // Subscription management rationale
    if (types.includes('subscription_management') && subscriptions?.short_term) {
      const subData = subscriptions.short_term;
      if (subData.recurring_merchants && subData.recurring_merchants.length > 0) {
        const merchantCount = subData.recurring_merchants.length;
        const monthlySpend = subData.total_monthly_recurring_spend || 0;
        rationale += `you have ${merchantCount} recurring subscription${merchantCount > 1 ? 's' : ''} totaling $${Math.round(monthlySpend).toLocaleString()} per month. `;
        rationale += `This tool can help you track and manage these subscriptions.`;
        return rationale;
      }
    }
    
    // Savings building rationale
    if (types.includes('savings_building') && savings?.short_term) {
      const savingsData = savings.short_term;
      if (savingsData.net_inflow > 0) {
        rationale += `you're already saving $${Math.round(savingsData.net_inflow).toLocaleString()} per month. `;
        rationale += `This resource can help you optimize your savings strategy.`;
        return rationale;
      } else {
        rationale += `building savings is a key financial goal. This guide will help you get started.`;
        return rationale;
      }
    }
    
    // Emergency fund rationale
    if (types.includes('emergency_fund') && savings?.short_term) {
      const savingsData = savings.short_term;
      const coverage = savingsData.emergency_fund_coverage_months || 0;
      if (coverage > 0) {
        rationale += `you currently have ${coverage} month${coverage !== 1 ? 's' : ''} of expenses covered. `;
        rationale += `This guide will help you build toward the recommended 3-6 months of coverage.`;
        return rationale;
      } else {
        rationale += `building an emergency fund provides financial security. This resource explains how to get started.`;
        return rationale;
      }
    }
    
    // Budgeting rationale
    if (types.includes('budgeting') && income?.short_term) {
      const incomeData = income.short_term;
      if (incomeData.payment_frequency === 'irregular') {
        rationale += `you have variable income. This budgeting approach can help you manage your finances more effectively.`;
        return rationale;
      }
      rationale += `creating a budget helps you take control of your finances. This guide will walk you through the process.`;
      return rationale;
    }
    
    // Payment planning rationale
    if (types.includes('payment_planning') && credit?.short_term) {
      if (credit.short_term.has_overdue) {
        rationale += `you have overdue payments. This guide will help you create a payment plan to get back on track.`;
        return rationale;
      }
      if (credit.short_term.has_minimum_payment_only) {
        rationale += `you're making minimum payments. This resource explains how paying more can save you money on interest.`;
        return rationale;
      }
    }
    
    // Expense tracking rationale
    if (types.includes('expense_tracking')) {
      rationale += `tracking your expenses helps you understand where your money goes. This tool makes it easy.`;
      return rationale;
    }
  }
  
  // Default rationale
  return rationale + `this resource aligns with your financial profile and goals.`;
}

/**
 * Generate rationale for a partner offer
 * @param {Object} offer - Partner offer
 * @param {Object} persona - Assigned persona
 * @param {Object} behavioralSignals - Behavioral analysis results
 * @param {Object} userData - User data and accounts
 * @returns {string} Plain-language rationale
 */
function generateOfferRationale(offer, persona, behavioralSignals, userData) {
  const { credit, income, subscriptions, savings } = behavioralSignals;
  
  // Base rationale
  let rationale = `Based on your ${persona.name} profile, `;
  
  // Add specific data points based on offer type
  if (offer.offer_category === 'balance_transfer' && credit?.short_term) {
    const creditData = credit.short_term;
    if (creditData.cards && creditData.cards.length > 0) {
      const highUtilCard = creditData.cards.find(c => c.utilization_level === 'high' || c.utilization_level === 'very_high');
      if (highUtilCard) {
        const account = Account.findById(highUtilCard.account_id);
        const cardEnding = account?.account_id ? account.account_id.slice(-4) : 'card';
        const interestCharges = creditData.has_interest_charges ? ' and paying interest charges' : '';
        rationale += `your ${cardEnding} card is at ${Math.round(highUtilCard.utilization_percentage)}% utilization${interestCharges}. `;
        rationale += `This balance transfer card offers 0% APR for 18 months, which could save you money while you pay down debt.`;
        return rationale;
      }
    }
  }
  
  if (offer.offer_category === 'high_yield_savings' && savings?.short_term) {
    const savingsData = savings.short_term;
    if (savingsData.total_savings_balance > 0) {
      const apyMatch = offer.benefits?.find(b => b.includes('APY'))?.match(/\d+\.\d+%/) || offer.benefits?.find(b => b.includes('%'))?.match(/\d+\.\d+%/) || null;
      const apy = apyMatch ? apyMatch[0] : 'competitive';
      rationale += `you have $${Math.round(savingsData.total_savings_balance).toLocaleString()} in savings. `;
      rationale += `This high-yield savings account offers ${apy} APY, helping your savings grow faster.`;
      return rationale;
    } else {
      rationale += `this high-yield savings account is a great way to start building your savings with competitive interest rates.`;
      return rationale;
    }
  }
  
  if (offer.offer_category === 'subscription_management' && subscriptions?.short_term) {
    const subData = subscriptions.short_term;
    if (subData.recurring_merchants && subData.recurring_merchants.length > 0) {
      rationale += `you have ${subData.recurring_merchants.length} recurring subscriptions. `;
      rationale += `This tool can help you track and cancel unused subscriptions, potentially saving you money.`;
      return rationale;
    }
  }
  
  if (offer.offer_category === 'budgeting' && income?.short_term) {
    const incomeData = income.short_term;
    if (incomeData.payment_frequency === 'irregular') {
      rationale += `you have variable income. This budgeting app can help you manage your finances with flexible budgeting tools.`;
      return rationale;
    }
    rationale += `this budgeting app can help you track expenses and reach your financial goals.`;
    return rationale;
  }
  
  if (offer.offer_category === 'credit_building') {
    if (!credit?.short_term || credit.short_term.credit_card_count === 0) {
      rationale += `this secured credit card can help you build or rebuild your credit history.`;
      return rationale;
    }
    if (credit.short_term.has_high_utilization) {
      rationale += `this secured card can help you establish better credit habits while you work on paying down existing debt.`;
      return rationale;
    }
  }
  
  if (offer.offer_category === 'debt_consolidation' && credit?.short_term) {
    const creditData = credit.short_term;
    if (creditData.cards && creditData.cards.length > 1) {
      const totalBalance = creditData.cards.reduce((sum, card) => sum + (card.balance || 0), 0);
      rationale += `you have multiple credit cards with a total balance of $${Math.round(totalBalance).toLocaleString()}. `;
      rationale += `A debt consolidation loan could simplify your payments and potentially lower your interest rate.`;
      return rationale;
    }
  }
  
  // Default rationale
  return rationale + `this offer aligns with your financial profile and goals.`;
}

/**
 * Generate rationale for a recommendation (education item or partner offer)
 * @param {Object} recommendation - Education item or partner offer
 * @param {string} type - 'education' or 'offer'
 * @param {Object} persona - Assigned persona
 * @param {Object} behavioralSignals - Behavioral analysis results
 * @param {Object} userData - User data and accounts
 * @returns {string} Plain-language rationale
 */
function generateRationale(recommendation, type, persona, behavioralSignals, userData) {
  if (type === 'education') {
    return generateEducationRationale(recommendation, persona, behavioralSignals, userData);
  } else if (type === 'offer') {
    return generateOfferRationale(recommendation, persona, behavioralSignals, userData);
  }
  
  return `This recommendation aligns with your ${persona.name} profile.`;
}

module.exports = {
  generateEducationRationale,
  generateOfferRationale,
  generateRationale
};

