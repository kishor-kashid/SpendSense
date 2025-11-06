import { useState, useCallback } from 'react';
import { getRecommendations } from '../services/api';

export const useRecommendations = (userId) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRecommendations = useCallback(async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getRecommendations(userId);
      
      // API interceptor returns response.data, so response is already the data object
      // Backend returns { success: true, recommendations: {...} }
      const recommendationsData = response.recommendations || response.data?.recommendations || response.data || response;
      
      setRecommendations(recommendationsData);
      return recommendationsData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(() => {
    return loadRecommendations();
  }, [loadRecommendations]);

  const clearRecommendations = useCallback(() => {
    setRecommendations(null);
    setError(null);
  }, []);

  return {
    recommendations,
    loading,
    error,
    loadRecommendations,
    refresh,
    clearRecommendations,
  };
};

export default useRecommendations;

