import { useState, useCallback } from 'react';
import { getRecommendations } from '../services/api';

export const useRecommendations = (userId) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRecommendations = useCallback(async () => {
    if (!userId) {
      console.log('useRecommendations - No userId, skipping');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`useRecommendations - Loading recommendations for user ${userId}...`);
      const response = await getRecommendations(userId);
      console.log('useRecommendations - getRecommendations response:', response);
      
      // API interceptor returns response.data, so response is already the data object
      // Backend returns { success: true, recommendations: {...} }
      const recommendationsData = response.recommendations || response.data?.recommendations || response.data || response;
      console.log('useRecommendations - extracted recommendations:', recommendationsData);
      console.log(`useRecommendations - Status: ${recommendationsData.status || 'unknown'}, Education items: ${recommendationsData.education_items?.length || 0}, Partner offers: ${recommendationsData.partner_offers?.length || 0}`);
      
      setRecommendations(recommendationsData);
      return recommendationsData;
    } catch (err) {
      console.error('useRecommendations - Error loading recommendations:', err);
      console.error('Error details:', err.response?.data || err.message);
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

