import React, { useState, useEffect } from 'react';
import { generateBudget, generateGoals } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import BudgetDisplay from './BudgetDisplay';
import GoalsDisplay from './GoalsDisplay';
import Loading from '../common/Loading';
import './BudgetGenerator.css';

const BudgetGenerator = () => {
  const { userId } = useAuth();
  const [budget, setBudget] = useState(null);
  const [goals, setGoals] = useState(null);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('budget');

  useEffect(() => {
    if (userId) {
      loadBudget();
      loadGoals();
    }
  }, [userId]);

  const loadBudget = async () => {
    if (!userId) return;

    setLoadingBudget(true);
    setError(null);

    try {
      const response = await generateBudget(userId);
      setBudget(response.budget || response);
    } catch (err) {
      console.error('Error loading budget:', err);
      setError(err.message || 'Failed to load budget');
    } finally {
      setLoadingBudget(false);
    }
  };

  const loadGoals = async () => {
    if (!userId) return;

    setLoadingGoals(true);
    setError(null);

    try {
      const response = await generateGoals(userId);
      setGoals(response.goals || response);
    } catch (err) {
      console.error('Error loading goals:', err);
      setError(err.message || 'Failed to load goals');
    } finally {
      setLoadingGoals(false);
    }
  };

  return (
    <div className="budget-generator">
      <div className="budget-generator-header">
        <h2>AI-Powered Budget & Goals</h2>
        <p className="budget-generator-subtitle">
          Get personalized budget recommendations and savings goals based on your spending patterns
        </p>
      </div>

      <div className="budget-generator-tabs">
        <button
          className={`budget-tab-button ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          Budget
        </button>
        <button
          className={`budget-tab-button ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          Goals
        </button>
      </div>

      {error && (
        <div className="budget-generator-error">
          <p>{error}</p>
          <button onClick={() => { loadBudget(); loadGoals(); }} className="retry-button">
            Retry
          </button>
        </div>
      )}

      <div className="budget-generator-content">
        {activeTab === 'budget' && (
          <BudgetDisplay budget={budget} loading={loadingBudget} />
        )}
        {activeTab === 'goals' && (
          <GoalsDisplay goals={goals} loading={loadingGoals} />
        )}
      </div>
    </div>
  );
};

export default BudgetGenerator;

