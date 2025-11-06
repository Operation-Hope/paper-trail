/**
 * Donor details header component
 * Displays donor information with a close button to return to search
 *
 * @param donor - The donor object containing name, type, employer, and state
 * @param onClose - Callback fired when the back button is clicked to return to search
 */
import { Card, CardContent } from './ui/card'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb'
import { Separator } from './ui/separator'
import type { Donor } from '../types/api'

interface DonorDetailsProps {
  donor: Donor
  onClose: () => void
}

export function DonorDetails({ donor, onClose }: DonorDetailsProps) {
  return (
    <>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={onClose} className="cursor-pointer">
              Donors
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{donor.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center pb-4">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {donor.name}
            </h2>
            <p className="text-lg text-muted-foreground">{donor.donortype}</p>
            {donor.employer && (
              <p className="text-sm text-gray-500 mt-1">
                Employer: {donor.employer}
              </p>
            )}
            {donor.state && (
              <p className="text-sm text-gray-500">State: {donor.state}</p>
            )}
          </div>
          <Separator />
        </CardContent>
      </Card>
    </>
  )
}
