/**
 * Vote record component displaying paginated voting history with filtering
 * Shows votes in a table with pagination controls and subject filtering
 */
import { useEffect, useState } from 'react';
import { useVotes } from '../hooks/useVotes';
import { VoteFilters } from './VoteFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { X, Info } from 'lucide-react';
import { api } from '../services/api';
import type { Vote } from '../types/api';

interface VoteRecordProps {
  politicianId: string;
  selectedSubjectForDonations?: string | null;
  onSubjectClick?: (subject: string | null) => void;
}

export function VoteRecord({ politicianId, selectedSubjectForDonations, onSubjectClick }: VoteRecordProps) {
  const {
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
  } = useVotes();

  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  useEffect(() => {
    loadVotes(politicianId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [politicianId]);

  useEffect(() => {
    const loadSubjects = async () => {
      setIsLoadingSubjects(true);
      try {
        const subjects = await api.getBillSubjects();
        setAvailableSubjects(subjects);
      } catch (err) {
        console.error('Failed to load bill subjects:', err);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    loadSubjects();
  }, []);

  const getVoteColor = (vote: Vote['Vote']): string => {
    switch (vote) {
      case 'Yea':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Nay':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Present':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Not Voting':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSubjectClick = (clickedSubject: string) => {
    // If clicking the same subject that's already selected for donations, deselect it
    if (selectedSubjectForDonations === clickedSubject && onSubjectClick) {
      onSubjectClick(null);
    } else {
      // Filter votes by this subject
      setSubject(clickedSubject);
      setCurrentPage(1);
      // Also filter donations by this subject
      if (onSubjectClick) {
        onSubjectClick(clickedSubject);
      }
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-red-600">Error loading votes: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Subject Filter Alert */}
      {selectedSubjectForDonations && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">
            Filtering donations by: {selectedSubjectForDonations}
          </AlertTitle>
          <AlertDescription className="text-blue-700 flex items-center justify-between">
            <span>
              Click on subject tags below to explore different topics, or clear the filter to see all donations.
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-6 px-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100"
              onClick={() => onSubjectClick && onSubjectClick(null)}
            >
              <X className="h-4 w-4 mr-1" />
              Clear filter
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Voting Record</CardTitle>
        </CardHeader>
        <CardContent>
          <VoteFilters
            billType={billType}
            setBillType={setBillType}
            subject={subject}
            setSubject={setSubject}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            availableSubjects={availableSubjects}
            isLoadingSubjects={isLoadingSubjects}
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">Loading votes...</div>
          </CardContent>
        </Card>
      ) : !voteData || voteData.votes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              No votes found with the current filters.
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Vote</TableHead>
                      <TableHead className="w-32">Bill Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-32">Date Introduced</TableHead>
                      <TableHead className="w-64">Subjects</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voteData.votes.map((vote) => (
                      <TableRow key={vote.VoteID}>
                        <TableCell>
                          <Badge className={getVoteColor(vote.Vote)}>
                            {vote.Vote}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {vote.BillNumber}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="line-clamp-2">{vote.Title}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(vote.DateIntroduced)}
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex flex-wrap gap-1">
                              {vote.subjects.slice(0, 3).map((subj, idx) => (
                                <Tooltip key={idx}>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      className={`cursor-pointer transition-all duration-200 ${
                                        selectedSubjectForDonations === subj
                                          ? 'bg-red-100 border-red-500 text-red-800 font-semibold shadow-sm'
                                          : 'hover:bg-blue-50 hover:border-blue-400 hover:scale-105 hover:shadow-sm'
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubjectClick(subj);
                                      }}
                                    >
                                      {subj}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {selectedSubjectForDonations === subj
                                        ? 'Click to clear filter'
                                        : 'Click to filter donations by this subject'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {vote.subjects.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{vote.subjects.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {voteData.pagination.totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {voteData.pagination.currentPage} of{' '}
                    {voteData.pagination.totalPages} ({voteData.pagination.totalVotes}{' '}
                    votes)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from(
                      { length: Math.min(5, voteData.pagination.totalPages) },
                      (_, i) => {
                        let pageNum: number;
                        if (voteData.pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (
                          currentPage >=
                          voteData.pagination.totalPages - 2
                        ) {
                          pageNum =
                            voteData.pagination.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return pageNum;
                      }
                    ).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === voteData.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
