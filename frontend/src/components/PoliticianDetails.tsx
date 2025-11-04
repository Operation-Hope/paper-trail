/**
 * Politician details view component
 * Displays comprehensive information including header, donation chart, and voting record
 */
import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { VoteRecord } from './VoteRecord';
import DonationChart from './DonationChart';
import type { Politician } from '../types/api';

interface PoliticianDetailsProps {
  politician: Politician;
  onClose: () => void;
}

export function PoliticianDetails({ politician, onClose }: PoliticianDetailsProps) {
  const [selectedSubjectForDonations, setSelectedSubjectForDonations] = useState<string | null>(null);

  const getPartyColor = (party: string): string => {
    if (party === 'Republican') return 'bg-red-100 text-red-800 border-red-300';
    if (party === 'Democratic') return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const handleSubjectClick = (subject: string | null) => {
    setSelectedSubjectForDonations(subject);
  };

  const handleDonationTitleClick = () => {
    if (selectedSubjectForDonations) {
      setSelectedSubjectForDonations(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold">
                  {politician.firstname} {politician.lastname}
                </h1>
                {!politician.isactive && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={getPartyColor(politician.party)}>
                  {politician.party}
                </Badge>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {politician.state}
                </Badge>
                {politician.role && (
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {politician.role}
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={onClose} variant="outline">
              Back to Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout: Donation Chart (left) and Vote Record (right) on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donation Chart Section */}
        <DonationChart
          politicianId={politician.politicianid}
          selectedTopic={selectedSubjectForDonations || undefined}
          onTopicChange={(topic) => setSelectedSubjectForDonations(topic || null)}
          onTitleClick={selectedSubjectForDonations ? handleDonationTitleClick : undefined}
        />

        {/* Vote Record Section */}
        <VoteRecord
          politicianId={politician.politicianid}
          selectedSubjectForDonations={selectedSubjectForDonations}
          onSubjectClick={handleSubjectClick}
        />
      </div>
    </div>
  );
}
