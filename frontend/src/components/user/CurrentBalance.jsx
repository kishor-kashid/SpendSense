import React from 'react';
import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';
import './CurrentBalance.css';

const CurrentBalance = ({ accounts, loading }) => {
  if (loading) {
    return (
      <Card>
        <p>Loading balance...</p>
      </Card>
    );
  }

  if (!accounts) {
    return (
      <Card>
        <p>No balance information available.</p>
      </Card>
    );
  }

  // Handle case where total_balance might be undefined or zero
  if (!accounts.total_balance || (accounts.total_balance.current === 0 && accounts.total_balance.available === 0)) {
    // Check if there are any depository accounts
    if (accounts.accounts && accounts.accounts.depository && accounts.accounts.depository.length > 0) {
      // Show accounts even if totals are zero
    } else {
      return (
        <Card>
          <p>No balance information available.</p>
        </Card>
      );
    }
  }

  const { current = 0, available = 0 } = accounts.total_balance || {};

  return (
    <Card className="current-balance-card">
      <h3 className="current-balance-title">💰 Current Balance</h3>
      <div className="current-balance-grid">
        <div className="balance-item">
          <div className="balance-label">Current Balance</div>
          <div className="balance-value">{formatCurrency(current)}</div>
        </div>
        <div className="balance-item">
          <div className="balance-label">Available Balance</div>
          <div className="balance-value available">{formatCurrency(available)}</div>
        </div>
      </div>
      {accounts.accounts && accounts.accounts.depository && accounts.accounts.depository.length > 0 && (
        <div className="account-list">
          <div className="account-list-label">Accounts:</div>
          {accounts.accounts.depository.map((account, index) => (
            <div key={account.account_id || index} className="account-item">
              <div className="account-info">
                <span className="account-type">{account.subtype || account.type || 'Account'}</span>
                <span className="account-id">{account.account_id?.substring(0, 8)}...</span>
              </div>
              <div className="account-balance">
                {formatCurrency(account.current_balance || 0)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default CurrentBalance;

