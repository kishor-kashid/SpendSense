import React, { useState } from 'react';
import Card from '../common/Card';
import Loading from '../common/Loading';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import './UserList.css';

const UserList = ({ users, onUserSelect, selectedUserId }) => {
  const [filter, setFilter] = useState('');
  const [personaFilter, setPersonaFilter] = useState('all');

  if (!users || users.length === 0) {
    return (
      <Card>
        <p>No users available.</p>
      </Card>
    );
  }

  // Ensure users is an array
  if (!Array.isArray(users)) {
    return (
      <Card>
        <p>Invalid users data.</p>
      </Card>
    );
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = filter === '' || 
      user.name?.toLowerCase().includes(filter.toLowerCase()) ||
      user.user_id?.toString().includes(filter);
    
    // Backend returns assigned_persona, not persona
    const persona = user.assigned_persona || user.persona;
    const matchesPersona = personaFilter === 'all' || 
      persona?.type === personaFilter || persona?.name === personaFilter;
    
    return matchesSearch && matchesPersona;
  });

  const uniquePersonas = [...new Set(users.map(u => {
    const persona = u.assigned_persona || u.persona;
    return persona?.type || persona?.name;
  }).filter(Boolean))];

  return (
    <Card title="Users" className="user-list-card">
      <div className="user-list-filters">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="user-list-search"
        />
        <select
          value={personaFilter}
          onChange={(e) => setPersonaFilter(e.target.value)}
          className="user-list-filter"
        >
          <option value="all">All Personas</option>
          {uniquePersonas.map(persona => (
            <option key={persona} value={persona}>{persona}</option>
          ))}
        </select>
      </div>

      <div className="user-list">
        {filteredUsers.map(user => (
          <div
            key={user.user_id}
            className={`user-list-item ${selectedUserId === user.user_id ? 'selected' : ''}`}
            onClick={() => onUserSelect(user.user_id)}
          >
            <div className="user-list-item-header">
              <div className="user-list-item-name">
                <strong>{user.name}</strong>
                <span className="user-list-item-id">ID: {user.user_id}</span>
              </div>
              {(user.assigned_persona || user.persona) && (
                <span className="user-list-item-persona">
                  {(user.assigned_persona || user.persona).name || (user.assigned_persona || user.persona).type}
                </span>
              )}
            </div>
            {user.behavioral_signals && (
              <div className="user-list-item-signals">
                {user.behavioral_signals.subscriptions && (
                  <span className="signal-badge">📱 Subscriptions</span>
                )}
                {user.behavioral_signals.savings && (
                  <span className="signal-badge">💰 Savings</span>
                )}
                {user.behavioral_signals.credit && (
                  <span className="signal-badge">💳 Credit</span>
                )}
                {user.behavioral_signals.income && (
                  <span className="signal-badge">💵 Income</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <p className="user-list-empty">No users match your filters.</p>
      )}
    </Card>
  );
};

export default UserList;

