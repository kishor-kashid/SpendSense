import React, { useState } from 'react';
import Card from '../common/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './TransactionList.css';

const TransactionList = ({ transactions, loading }) => {
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // date, amount, merchant

  if (loading) {
    return (
      <Card>
        <p>Loading transactions...</p>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <p>No transactions found.</p>
      </Card>
    );
  }

  // Get unique categories
  const categories = [...new Set(transactions
    .map(t => t.personal_finance_category_primary || 'Uncategorized')
    .filter(Boolean))];

  // Filter transactions
  let filtered = transactions.filter(t => {
    const matchesSearch = filter === '' ||
      (t.merchant_name && t.merchant_name.toLowerCase().includes(filter.toLowerCase())) ||
      (t.personal_finance_category_primary && t.personal_finance_category_primary.toLowerCase().includes(filter.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' ||
      (t.personal_finance_category_primary || 'Uncategorized') === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Sort transactions
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'amount') {
      return Math.abs(b.amount) - Math.abs(a.amount);
    } else if (sortBy === 'merchant') {
      return (a.merchant_name || '').localeCompare(b.merchant_name || '');
    }
    return 0;
  });

  // Calculate spending vs income
  const spending = filtered.filter(t => t.amount < 0);
  const income = filtered.filter(t => t.amount > 0);
  const totalSpending = Math.abs(spending.reduce((sum, t) => sum + t.amount, 0));
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="transaction-list">
      <div className="transaction-list-header">
        <h3>Transactions ({filtered.length})</h3>
        <div className="transaction-list-summary">
          <span className="summary-item spending">
            Spending: {formatCurrency(totalSpending)}
          </span>
          <span className="summary-item income">
            Income: {formatCurrency(totalIncome)}
          </span>
        </div>
      </div>

      <div className="transaction-filters">
        <input
          type="text"
          placeholder="Search by merchant or category..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="transaction-search"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="transaction-category-filter"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="transaction-sort"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
          <option value="merchant">Sort by Merchant</option>
        </select>
      </div>

      <div className="transaction-list-items">
        {filtered.map((transaction) => {
          const isSpending = transaction.amount < 0;
          const amount = Math.abs(transaction.amount);
          const category = transaction.personal_finance_category_primary || 'Uncategorized';

          return (
            <div key={transaction.transaction_id} className="transaction-item">
              <div className="transaction-item-main">
                <div className="transaction-item-info">
                  <div className="transaction-merchant">
                    {transaction.merchant_name || 'Unknown Merchant'}
                  </div>
                  <div className="transaction-details">
                    <span className="transaction-category">{category}</span>
                    <span className="transaction-date">{formatDate(transaction.date)}</span>
                  </div>
                </div>
                <div className={`transaction-amount ${isSpending ? 'spending' : 'income'}`}>
                  {isSpending ? '-' : '+'}{formatCurrency(amount)}
                </div>
              </div>
              {transaction.pending === true && (
                <div className="transaction-pending-badge">Pending</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionList;

