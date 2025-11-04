/**
 * Donation chart component
 * Displays donation breakdown by industry using Chart.js
 * Supports optional topic filtering for industry-specific analysis
 */
import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type TooltipItem } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { api } from '../services/api';
import type { DonationSummary } from '../types/api';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PieChart } from 'lucide-react';

// CRITICAL: Register Chart.js components before use
ChartJS.register(ArcElement, Tooltip, Legend);

interface DonationChartProps {
  politicianId: string;
  selectedTopic?: string;
  onTopicChange?: (topic: string) => void;
  onTitleClick?: () => void;
}

const COLORS = [
  '#FF6384', // Pink
  '#36A2EB', // Blue
  '#FFCE56', // Yellow
  '#4BC0C0', // Teal
  '#9966FF', // Purple
  '#FF9F40', // Orange
  '#E91E63', // Magenta
  '#4CAF50', // Green
  '#795548', // Brown
  '#607D8B', // Blue Grey
];

const TOPICS = [
  'Health',
  'Finance',
  'Technology',
  'Defense',
  'Energy',
  'Environment',
  'Education',
  'Agriculture',
  'Transportation',
];

export default function DonationChart({
  politicianId,
  selectedTopic,
  onTopicChange,
  onTitleClick,
}: DonationChartProps) {
  const [donations, setDonations] = useState<DonationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDonations = async () => {
      if (!isMounted) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = selectedTopic
          ? await api.getFilteredDonationSummary(politicianId, selectedTopic)
          : await api.getDonationSummary(politicianId);

        if (isMounted) {
          setDonations(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load donations');
          setDonations([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDonations();

    return () => {
      isMounted = false;
    };
  }, [politicianId, selectedTopic]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-64 mx-auto" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Skeleton className="h-64 w-64 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-red-600 text-center py-8">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (donations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {selectedTopic ? `Donation Summary (Filtered by: ${selectedTopic})` : 'Donation Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-4">
            <PieChart className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <div>
              <h3 className="font-semibold text-lg mb-2">No Donation Data</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {selectedTopic
                  ? `No large donations found for "${selectedTopic}" related industries. Try selecting a different topic to explore other donation patterns.`
                  : 'No large donation records found for this politician in our database. This may indicate no reportable donations over the minimum threshold.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: donations.map((d) => d.industry || 'Unknown'),
    datasets: [
      {
        data: donations.map((d) => d.totalamount),
        backgroundColor: COLORS,
        borderWidth: 1,
      },
    ],
  };

  const handleChartClick = (_event: unknown, elements: unknown[]) => {
    if (!onTopicChange) return;

    const chartElements = elements as Array<{ index: number }>;
    if (chartElements.length > 0) {
      const clickedIndex = chartElements[0].index;
      const clickedIndustry = donations[clickedIndex]?.industry;

      if (clickedIndustry) {
        // If clicking the currently selected industry, deselect it
        if (selectedTopic === clickedIndustry) {
          onTopicChange('');
        } else {
          // Find the topic that corresponds to this industry
          // Note: This is a simple mapping - we could enhance this later
          onTopicChange(clickedIndustry);
        }
      }
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    onClick: handleChartClick,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  const titleText = selectedTopic
    ? `Donation Summary (Filtered by: ${selectedTopic})`
    : 'Donation Summary';

  return (
    <Card>
      <CardHeader>
        <CardTitle
          className={`text-xl ${onTitleClick ? 'cursor-pointer hover:opacity-70' : ''}`}
          onClick={onTitleClick}
          title={onTitleClick ? 'Click to show all donors' : undefined}
        >
          {titleText}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {onTopicChange && (
          <div className="mb-6">
            <label htmlFor="topic-filter" className="block mb-2 text-sm font-medium">
              Filter by Topic:
            </label>
            <Select value={selectedTopic || 'all'} onValueChange={(value) => onTopicChange(value === 'all' ? '' : value)}>
              <SelectTrigger id="topic-filter" className="w-full md:w-64" aria-label="Filter donations by topic">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {TOPICS.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div
          className="max-w-md mx-auto mb-2 cursor-pointer"
          role="img"
          aria-label="Doughnut chart showing donation breakdown by industry. Click on a segment to filter."
        >
          <Doughnut data={chartData} options={chartOptions} />
        </div>

        {onTopicChange && (
          <p className="text-xs text-center text-muted-foreground mb-4">
            💡 Click on a chart segment to filter by industry
          </p>
        )}

        <div className="mt-6">
          <h4 className="font-semibold mb-3 text-sm">Total by Industry:</h4>
          <div className="space-y-2">
            {donations.map((d, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></span>
                  {d.industry || 'Unknown'}
                </span>
                <span className="font-medium">
                  ${d.totalamount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
