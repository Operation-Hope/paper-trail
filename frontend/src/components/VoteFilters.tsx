/**
 * Vote filtering UI component
 * Provides bill type, subject, and sort order filtering controls
 */
import { useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Badge } from './ui/badge';

interface VoteFiltersProps {
  billType: string;
  setBillType: (type: string) => void;
  subject: string;
  setSubject: (subject: string) => void;
  sortOrder: 'ASC' | 'DESC';
  setSortOrder: (order: 'ASC' | 'DESC') => void;
  availableSubjects: string[];
  isLoadingSubjects: boolean;
}

export function VoteFilters({
  billType,
  setBillType,
  subject,
  setSubject,
  sortOrder,
  setSortOrder,
  availableSubjects,
  isLoadingSubjects,
}: VoteFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const billTypes = [
    { id: 'hr', label: 'House (HR)' },
    { id: 's', label: 'Senate (S)' },
    { id: 'hjres', label: 'HJRes (House Joint)' },
    { id: 'sjres', label: 'SJRes (Senate Joint)' },
  ];

  const handleBillTypeChange = (type: string, checked: boolean) => {
    const currentTypes = billType.split(',').filter(Boolean);

    if (checked) {
      // Add the type
      const newTypes = [...currentTypes, type];
      setBillType(newTypes.join(','));
    } else {
      // Remove the type
      const newTypes = currentTypes.filter(t => t !== type);
      setBillType(newTypes.join(','));
    }
  };

  const isBillTypeChecked = (type: string): boolean => {
    return billType.split(',').includes(type);
  };

  const handleSubjectChange = (subj: string, checked: boolean) => {
    const currentSubjects = subject.split(',').filter(Boolean);

    if (checked) {
      // Add the subject
      const newSubjects = [...currentSubjects, subj];
      setSubject(newSubjects.join(','));
    } else {
      // Remove the subject
      const newSubjects = currentSubjects.filter(s => s !== subj);
      setSubject(newSubjects.join(','));
    }
  };

  const isSubjectChecked = (subj: string): boolean => {
    return subject.split(',').includes(subj);
  };

  const clearFilters = () => {
    setBillType('');
    setSubject('');
    setSortOrder('DESC');
  };

  // Count active filters
  const activeFilterCount = (() => {
    let count = 0;
    if (billType) count += billType.split(',').filter(Boolean).length;
    if (subject) count += subject.split(',').filter(Boolean).length;
    if (sortOrder !== 'DESC') count += 1;
    return count;
  })();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Filter Votes</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle filters</span>
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="space-y-4 p-4 bg-muted rounded-lg border">
        {/* Bill Type Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Bill Type</Label>
          <div className="flex gap-4">
            {billTypes.map((type) => (
              <div key={type.id} className="flex items-center gap-2">
                <Checkbox
                  id={`bill-type-${type.id}`}
                  checked={isBillTypeChecked(type.id)}
                  onCheckedChange={(checked) =>
                    handleBillTypeChange(type.id, checked === true)
                  }
                />
                <Label
                  htmlFor={`bill-type-${type.id}`}
                  className="text-sm cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Bill Subjects</Label>
          {isLoadingSubjects ? (
            <div className="text-sm text-muted-foreground">Loading subjects...</div>
          ) : (
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1 bg-background">
              {availableSubjects.length === 0 ? (
                <div className="text-sm text-muted-foreground">No subjects available</div>
              ) : (
                availableSubjects.map((subj) => (
                  <div key={subj} className="flex items-center gap-2">
                    <Checkbox
                      id={`subject-${subj}`}
                      checked={isSubjectChecked(subj)}
                      onCheckedChange={(checked) =>
                        handleSubjectChange(subj, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`subject-${subj}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {subj}
                    </Label>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sort Order</Label>
          <div className="flex gap-2">
            <Button
              variant={sortOrder === 'DESC' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('DESC')}
            >
              Newest First
            </Button>
            <Button
              variant={sortOrder === 'ASC' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortOrder('ASC')}
            >
              Oldest First
            </Button>
          </div>
        </div>

        {/* Clear Filters Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="w-full"
        >
          Clear All Filters
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
