/**
 * Custom hook for managing politician vote data with pagination and filtering
 * Handles vote loading, pagination state, sorting, and bill type/subject filtering
 */
import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { VoteResponse, VoteParams } from '../types/api';

interface UseVotesResult {
  voteData: VoteResponse | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  sortOrder: 'ASC' | 'DESC';
  billType: string;
  subject: string;
  setCurrentPage: (page: number) => void;
  setSortOrder: (order: 'ASC' | 'DESC') => void;
  setBillType: (type: string) => void;
  setSubject: (subject: string) => void;
  loadVotes: (politicianId: string) => Promise<void>;
}

export function useVotes(): UseVotesResult {
  const [voteData, setVoteData] = useState<VoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [billType, setBillType] = useState('');
  const [subject, setSubject] = useState('');
  const [politicianId, setPoliticianId] = useState<string | null>(null);
  const isResettingFilters = useRef(false);

  const loadVotes = async (id: string) => {
    // Detect if switching to a different politician
    const isNewPolitician = politicianId !== null && politicianId !== id;

    // Reset filters and pagination when switching to a different politician
    if (isNewPolitician) {
      // Set flag to prevent useEffect from triggering duplicate API call
      isResettingFilters.current = true;
      setCurrentPage(1);
      setSortOrder('DESC');
      setBillType('');
      setSubject('');
    }

    setPoliticianId(id);
    setIsLoading(true);
    setError(null);

    try {
      // Use reset values if switching politicians, otherwise use current state
      const params: VoteParams = {
        page: isNewPolitician ? 1 : currentPage,
        sort: isNewPolitician ? 'DESC' : sortOrder,
      };

      const activeBillType = isNewPolitician ? '' : billType;
      const activeSubject = isNewPolitician ? '' : subject;

      if (activeBillType) {
        // Split comma-separated string into array
        const types = activeBillType.split(',').filter(Boolean);
        params.type = types.length === 1 ? types[0] : types;
      }
      if (activeSubject) {
        // Split comma-separated string into array
        const subjects = activeSubject.split(',').filter(Boolean);
        params.subject = subjects.length === 1 ? subjects[0] : subjects;
      }

      const data = await api.getPoliticianVotes(id, params);
      setVoteData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load votes');
      setVoteData(null);
    } finally {
      setIsLoading(false);
      // Clear the flag after API call completes
      if (isNewPolitician) {
        isResettingFilters.current = false;
      }
    }
  };

  // Reload when filters change (but not when resetting filters during politician switch)
  useEffect(() => {
    if (politicianId && !isResettingFilters.current) {
      loadVotes(politicianId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortOrder, billType, subject]);

  return {
    voteData,
    isLoading,
    error,
    currentPage,
    sortOrder,
    billType,
    subject,
    setCurrentPage,
    setSortOrder,
    setBillType,
    setSubject,
    loadVotes,
  };
}
