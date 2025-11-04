import { useState, useCallback } from 'react';
import { getRecommendations } from '../services/api';

export const useRecommendations = (userId) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRecommendations = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getRecommendations(userId);
      console.log('useRecommendations - getRecommendations response:', response);
      
      // API interceptor returns response.data, so response is already the data object
      // Backend returns { success: true, recommendations: {...} }
      const recommendationsData = response.recommendations || response.data?.recommendations || response.data || response;
      console.log('useRecommendations - extracted recommendations:', recommendationsData);
      
      setRecommendations(recommendationsData);
      return recommendationsData;
    } catch (err) {
      console.error('useRecommendations - Error loading recommendations:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(() => {
    return loadRecommendations();
  }, [loadRecommendations]);

  return {
    recommendations,
    loading,
    error,
    loadRecommendations,
    refresh,
  };
};

export default useRecommendations;

