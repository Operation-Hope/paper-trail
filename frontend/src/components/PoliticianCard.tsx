/**
 * Politician card component for displaying a politician in search results
 * Shows name, party, state, role, and active status with clickable interaction
 */
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { Politician } from '../types/api';

interface PoliticianCardProps {
  politician: Politician;
  onSelect: (politician: Politician) => void;
}

export function PoliticianCard({ politician, onSelect }: PoliticianCardProps) {
  const getPartyColor = (party: string): string => {
    if (party === 'Republican') return 'bg-red-100 text-red-800 border-red-300';
    if (party === 'Democratic') return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getAvatarColor = (party: string): string => {
    if (party === 'Republican') return 'bg-red-500 text-white';
    if (party === 'Democratic') return 'bg-blue-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const getInitials = (firstname: string, lastname: string): string => {
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => onSelect(politician)}
    >
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Avatar className={`size-12 ${getAvatarColor(politician.party)}`}>
            <AvatarFallback className={getAvatarColor(politician.party)}>
              {getInitials(politician.firstname, politician.lastname)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">
                {politician.firstname} {politician.lastname}
              </h3>
            {!politician.isactive && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={getPartyColor(politician.party)}>
                {politician.party}
              </Badge>
              <Badge variant="outline">{politician.state}</Badge>
              {politician.role && (
                <Badge variant="secondary">{politician.role}</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
