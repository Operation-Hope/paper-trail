/**
 * Custom hook for managing politician vote data with pagination and filtering
 * Uses TanStack Query for caching and automatic refetching
 */
import { useState, useEffect } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { queryKeys } from '../lib/query/keys';
import type { VoteResponse, VoteParams } from '../types/api';

interface UseVotesParams {
  politicianId: string;
}

interface UseVotesResult {
  voteData: VoteResponse;
  currentPage: number;
  sortOrder: 'ASC' | 'DESC';
  billType: string;
  subject: string;
  setCurrentPage: (page: number) => void;
  setSortOrder: (order: 'ASC' | 'DESC') => void;
  setBillType: (type: string) => void;
  setSubject: (subject: string) => void;
}

export function useVotes({ politicianId }: UseVotesParams): UseVotesResult {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [billType, setBillType] = useState('');
  const [subject, setSubject] = useState('');

  // Reset filters when politician changes
  // This is intentional: we want to reset all filter state when viewing a different politician
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setCurrentPage(1);
    setSortOrder('DESC');
    setBillType('');
    setSubject('');
  }, [politicianId]);

  // Build filters object for query key
  const filters = {
    types: billType ? billType.split(',').filter(Boolean) : undefined,
    subjects: subject ? subject.split(',').filter(Boolean) : undefined,
  };

  // Fetch votes with TanStack Query
  const { data: voteData } = useSuspenseQuery({
    queryKey: queryKeys.politicians.votes(
      politicianId,
      currentPage,
      sortOrder,
      filters
    ),
    queryFn: async () => {
      const params: VoteParams = {
        page: currentPage,
        sort: sortOrder,
      };

      if (filters.types) {
        params.type =
          filters.types.length === 1 ? filters.types[0] : filters.types;
      }
      if (filters.subjects) {
        params.subject =
          filters.subjects.length === 1
            ? filters.subjects[0]
            : filters.subjects;
      }

      return api.getPoliticianVotes(Number(politicianId), params);
    },
  });

  return {
    voteData,
    currentPage,
    sortOrder,
    billType,
    subject,
    setCurrentPage,
    setSortOrder,
    setBillType,
    setSubject,
  };
}

/**
 * Hook for fetching available bill subjects
 * Uses TanStack Query for caching
 */
export function useBillSubjects() {
  return useSuspenseQuery({
    queryKey: queryKeys.bills.subjects(),
    queryFn: api.getBillSubjects,
    staleTime: Infinity, // Subjects rarely change
  });
}
