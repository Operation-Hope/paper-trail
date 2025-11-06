/**
 * Vote record component displaying paginated voting history with filtering
 * Shows votes in a table with pagination controls and subject filtering
 */
import { Suspense } from 'react'
import { useVotes, useBillSubjects } from '../hooks/useVotes'
import { VoteFilters } from './VoteFilters'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Skeleton } from './ui/skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination'
import { X, Info, FileSearch } from 'lucide-react'
import { formatDate } from '../utils/formatters'
import { ErrorBoundary } from './ErrorBoundary'
import type { Vote } from '../types/api'

interface VoteRecordProps {
  politicianId: string
  selectedSubjectForDonations?: string | null
  onSubjectClick?: (subject: string | null) => void
}

function VoteRecordContent({
  politicianId,
  selectedSubjectForDonations,
  onSubjectClick,
}: VoteRecordProps) {
  const {
    voteData,
    currentPage,
    sortOrder,
    billType,
    subject,
    setCurrentPage,
    setSortOrder,
    setBillType,
    setSubject,
  } = useVotes({ politicianId })

  const { data: availableSubjects } = useBillSubjects()

  const getVoteColor = (vote: Vote['Vote']): string => {
    switch (vote) {
      case 'Yea':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'Nay':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'Present':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Not Voting':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const handleSubjectClick = (clickedSubject: string) => {
    // If clicking the same subject that's already selected for donations, deselect it
    if (selectedSubjectForDonations === clickedSubject && onSubjectClick) {
      onSubjectClick(null)
    } else {
      // Filter votes by this subject
      setSubject(clickedSubject)
      setCurrentPage(1)
      // Also filter donations by this subject
      if (onSubjectClick) {
        onSubjectClick(clickedSubject)
      }
    }
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
              Click on subject tags below to explore different topics, or clear
              the filter to see all donations.
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
          />
        </CardContent>
      </Card>

      {!voteData || voteData.votes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 space-y-4">
              <FileSearch className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="font-semibold text-lg mb-2">No Votes Found</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  No voting records match your current filters. Try adjusting
                  the bill type, subject, or sort order to see more results.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBillType('')
                  setSubject('')
                  setSortOrder('DESC')
                  setCurrentPage(1)
                }}
              >
                Clear All Filters
              </Button>
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
                                        e.stopPropagation()
                                        handleSubjectClick(subj)
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
                    {voteData.pagination.totalPages} (
                    {voteData.pagination.totalVotes} votes)
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(currentPage - 1)}
                          className={
                            currentPage === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>

                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setCurrentPage(1)}
                              isActive={currentPage === 1}
                              className="cursor-pointer"
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {currentPage > 4 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}

                      {/* Page numbers around current page */}
                      {Array.from(
                        { length: voteData.pagination.totalPages },
                        (_, i) => i + 1
                      )
                        .filter((pageNum) => {
                          // Show pages within 2 of current page
                          return Math.abs(pageNum - currentPage) <= 2
                        })
                        .map((pageNum) => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={pageNum === currentPage}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                      {/* Last page */}
                      {currentPage < voteData.pagination.totalPages - 2 && (
                        <>
                          {currentPage < voteData.pagination.totalPages - 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() =>
                                setCurrentPage(voteData.pagination.totalPages)
                              }
                              isActive={
                                currentPage === voteData.pagination.totalPages
                              }
                              className="cursor-pointer"
                            >
                              {voteData.pagination.totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(currentPage + 1)}
                          className={
                            currentPage === voteData.pagination.totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// Loading fallback component
function VoteRecordSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Voting Record</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

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
                {Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Wrapper component with Suspense boundary
export function VoteRecord(props: VoteRecordProps) {
  return (
    <ErrorBoundary fallbackTitle="Error loading voting record">
      <Suspense fallback={<VoteRecordSkeleton />}>
        <VoteRecordContent {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}
