import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVocabularyList, getVocabularyStats, deleteVocabularyWord, VocabularyWord } from '../api';

/**
 * Hook to fetch vocabulary list
 */
export function useVocabularyList(params?: {
  masteryLevel?: number;
  searchQuery?: string;
  sortBy?: 'word' | 'created_at' | 'mastery_level' | 'next_review_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['vocabulary-list', params],
    queryFn: () => getVocabularyList(params),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch vocabulary statistics
 */
export function useVocabularyStats() {
  return useQuery({
    queryKey: ['vocabulary-stats'],
    queryFn: () => getVocabularyStats(),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to delete a vocabulary word
 */
export function useDeleteVocabularyWord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVocabularyWord,
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['vocabulary-list'] });
      queryClient.invalidateQueries({ queryKey: ['vocabulary-stats'] });
    },
  });
}
