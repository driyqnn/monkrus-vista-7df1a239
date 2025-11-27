import { useState, useEffect, useCallback } from 'react';
import type { FetchState } from '../types';

export function useFetchJSON<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = []
): FetchState<T> & { refetch: () => void } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await fetchFn();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
  }, deps);

  // Refetch on window focus for fresh data
  useEffect(() => {
    const handleFocus = () => {
      if (!state.loading) {
        refetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch, state.loading]);

  return { ...state, refetch };
}