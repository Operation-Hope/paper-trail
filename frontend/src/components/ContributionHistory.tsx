/**
 * Contribution history component
 * Displays a list of donations made by a donor with formatted amounts and dates
 *
 * @param donations - Array of donation records to display
 * @param isLoading - Loading state for async donation fetch
 * @param error - Error message if donation fetch failed
 * @param threshold - Minimum donation amount threshold (defaults to 2000)
 */
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Donation } from '../types/api';

interface ContributionHistoryProps {
  donations: Donation[];
  isLoading: boolean;
  error: string | null;
  threshold?: number;
}

export function ContributionHistory({
  donations,
  isLoading,
  error,
  threshold = 2000
}: ContributionHistoryProps) {
  const thresholdDisplay = threshold ? `(> $${threshold.toLocaleString()})` : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          Contribution History {thresholdDisplay}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="border-t border-border pt-3 pb-1 first:border-t-0 first:pt-0"
              >
                <div className="flex justify-between items-center mb-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p className="font-semibold">Could not load contribution history: {error}</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground space-y-2">
            <p className="font-medium">
              No large contributions found {thresholdDisplay} to politicians in our database.
            </p>
            <p className="text-sm">
              This donor may have:
            </p>
            <ul className="text-sm text-left inline-block">
              <li>• Made smaller contributions (under ${threshold.toLocaleString()})</li>
              <li>• Not contributed to politicians we track</li>
              <li>• Contributed only to state/local politicians</li>
            </ul>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
            {donations.map((donation, index) => (
              <div
                key={index}
                className="border-t border-border pt-3 pb-1 first:border-t-0 first:pt-0"
              >
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold text-foreground">
                    {donation.firstname} {donation.lastname} ({donation.party}-{donation.state})
                  </p>
                  <p className="font-bold text-green-600">
                    {formatCurrency(donation.amount)}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  Date: {formatDate(donation.date)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
