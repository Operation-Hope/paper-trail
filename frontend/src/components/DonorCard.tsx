/**
 * Donor card component for displaying a donor in search results
 * Shows name, type, employer (if available), and state (if available) with clickable interaction
 *
 * @param donor - The donor object containing name, type, employer, and state
 * @param onSelect - Callback fired when donor is selected (clicked or Enter/Space pressed)
 */
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import type { Donor } from '../types/api'

interface DonorCardProps {
  donor: Donor
  onSelect: (donor: Donor) => void
}

export function DonorCard({ donor, onSelect }: DonorCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(donor)
    }
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 focus:ring-2 focus:ring-ring focus:outline-none"
      onClick={() => onSelect(donor)}
      onKeyDown={handleKeyDown}
    >
      <CardContent className="pt-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-primary">{donor.name}</h3>

          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              {donor.donortype}
              {donor.employer && ` - ${donor.employer}`}
            </p>
            {donor.state && (
              <Badge variant="outline" className="w-fit">
                {donor.state}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
