/**
 * Unified Search page with tabs for Politicians and Donors
 * Uses React 19 Suspense for declarative loading states
 */
import { useEffect, useState, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { usePoliticianSearch } from '../hooks/usePoliticianSearch';
import { useDonorSearch } from '../hooks/useDonorSearch';
import { useRouteState } from '../utils/routing';
import { PoliticianSearchResults } from '../components/PoliticianSearchResults';
import { DonorSearchResults } from '../components/DonorSearchResults';
import { PoliticianDetails } from '../components/PoliticianDetails';
import { PoliticianComparison } from '../components/PoliticianComparison';
import { DonorDetails } from '../components/DonorDetails';
import { ContributionHistory } from '../components/ContributionHistory';
import { api } from '../services/api';
import type { Politician, Donor } from '../types/api';

type SearchType = 'politician' | 'donor';

export default function UnifiedSearch() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL
  const activeTab: SearchType = location.pathname.startsWith('/donor') ? 'donor' : 'politician';

  // Politician search state
  const politicianSearch = usePoliticianSearch();
  const {
    query: politicianQuery,
    setQuery: setPoliticianQuery,
    politicians,
    selectedPolitician,
    comparisonPoliticians,
    isComparing,
    isLoading: isPoliticianLoading,
    error: politicianError,
    search: searchPoliticians,
    selectPolitician,
    toggleComparison,
    clearSelection: clearPoliticianSelection,
    clearComparison,
  } = politicianSearch;

  // Donor search state
  const donorSearch = useDonorSearch();
  const {
    query: donorQuery,
    setQuery: setDonorQuery,
    donors,
    selectedDonor,
    donations,
    isSearching: isDonorSearching,
    isLoadingDonations,
    searchError: donorSearchError,
    donationsError,
    search: searchDonors,
    selectDonor,
    clearSelection: clearDonorSelection,
  } = donorSearch;

  const {
    entityId,
    searchQuery,
    navigateToEntity,
    navigateToSearch,
    navigateBack,
  } = useRouteState();

  // Local input state for each search type
  const [politicianInput, setPoliticianInput] = useState(politicianQuery);
  const [donorInput, setDonorInput] = useState(donorQuery);

  // Sync input with query when query changes
  useEffect(() => {
    setPoliticianInput(politicianQuery);
  }, [politicianQuery]);

  useEffect(() => {
    setDonorInput(donorQuery);
  }, [donorQuery]);

  // Handle tab changes - clear results and navigate to appropriate URL
  const handleTabChange = (value: string) => {
    const newTab = value as SearchType;

    // Navigate to the new tab's URL
    if (newTab === 'politician') {
      navigate('/politician');
    } else {
      navigate('/donor');
    }
  };

  // Clear results when switching tabs
  useEffect(() => {
    if (activeTab === 'politician') {
      // Clear donor results when switching to politician
      if (selectedDonor) {
        clearDonorSelection();
      }
    } else {
      // Clear politician results when switching to donor
      if (selectedPolitician) {
        clearPoliticianSelection();
      }
      if (isComparing) {
        clearComparison();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Hydrate politician state from URL
  useEffect(() => {
    if (activeTab !== 'politician') return;

    const loadFromUrl = async () => {
      if (entityId) {
        const politicianId = Number(entityId);
        if (selectedPolitician?.politicianid === politicianId) {
          return;
        }
        const politician = politicians.find((p) => p.politicianid === politicianId);
        if (politician) {
          selectPolitician(politician);
          return;
        }
        try {
          const fetchedPolitician = await api.getPolitician(politicianId);
          selectPolitician(fetchedPolitician);
        } catch (err) {
          console.error('Failed to load politician from URL:', err);
        }
      } else if (searchQuery && searchQuery !== politicianQuery) {
        setPoliticianInput(searchQuery);
        setPoliticianQuery(searchQuery);
        if (searchQuery.length >= 2) {
          searchPoliticians(searchQuery);
        }
      }
    };

    loadFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, searchQuery, activeTab]);

  // Hydrate donor state from URL
  useEffect(() => {
    if (activeTab !== 'donor') return;

    const loadFromUrl = async () => {
      if (entityId) {
        const donorId = Number(entityId);
        if (selectedDonor?.donorid === donorId) {
          return;
        }
        const donor = donors.find((d) => d.donorid === donorId);
        if (donor) {
          selectDonor(donor);
          return;
        }
        try {
          const fetchedDonor = await api.getDonor(donorId);
          selectDonor(fetchedDonor);
        } catch (err) {
          console.error('Failed to load donor from URL:', err);
        }
      } else if (searchQuery && searchQuery !== donorQuery) {
        setDonorInput(searchQuery);
        setDonorQuery(searchQuery);
        if (searchQuery.length >= 3) {
          searchDonors(searchQuery);
        }
      }
    };

    loadFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, searchQuery, activeTab]);

  // Sync URL when politician is selected
  useEffect(() => {
    if (activeTab === 'politician' && selectedPolitician && !entityId) {
      navigateToEntity(selectedPolitician.politicianid, 'politician');
    }
  }, [selectedPolitician, entityId, navigateToEntity, activeTab]);

  // Sync URL when donor is selected
  useEffect(() => {
    if (activeTab === 'donor' && selectedDonor && !entityId) {
      navigateToEntity(selectedDonor.donorid, 'donor');
    }
  }, [selectedDonor, entityId, navigateToEntity, activeTab]);

  // Politician search handlers
  const handlePoliticianSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPoliticianQuery(politicianInput);
    if (politicianInput.length >= 2) {
      await searchPoliticians(politicianInput);
      navigateToSearch('politician', politicianInput);
    } else if (politicianInput.length === 0) {
      navigateToSearch('politician');
    }
  };

  const handlePoliticianInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPoliticianInput(e.target.value);
  };

  const handlePoliticianKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePoliticianSearch(e as any);
    }
  };

  const handleClearPoliticianSelection = () => {
    clearPoliticianSelection();
    navigateBack();
  };

  // Donor search handlers
  const handleDonorSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setDonorQuery(donorInput);
    if (donorInput.length >= 3) {
      await searchDonors(donorInput);
      navigateToSearch('donor', donorInput);
    } else if (donorInput.length === 0) {
      navigateToSearch('donor');
    }
  };

  const handleDonorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDonorInput(e.target.value);
  };

  const handleDonorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDonorSearch(e as any);
    }
  };

  const handleClearDonorSelection = () => {
    clearDonorSelection();
    navigateBack();
  };

  // If comparing politicians, show comparison view
  if (isComparing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PoliticianComparison
          politicians={comparisonPoliticians as [Politician, Politician]}
          onClose={clearComparison}
        />
      </div>
    );
  }

  // If politician is selected, show politician details
  if (activeTab === 'politician' && selectedPolitician) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PoliticianDetails
          politician={selectedPolitician}
          onClose={handleClearPoliticianSelection}
        />
      </div>
    );
  }

  // If donor is selected, show donor details
  if (activeTab === 'donor' && selectedDonor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DonorDetails
          donor={selectedDonor}
          onClose={handleClearDonorSelection}
        />
        <ContributionHistory
          donations={donations}
          isLoading={isLoadingDonations}
          error={donationsError}
        />
      </div>
    );
  }

  // Main search interface with tabs
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <TabsList>
                <TabsTrigger value="politician">Search Politicians</TabsTrigger>
                <TabsTrigger value="donor">Search Donors</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="politician" className="mt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Find politicians and explore their voting records and campaign donations
              </p>
              <form onSubmit={handlePoliticianSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter politician name (minimum 2 characters)"
                  value={politicianInput}
                  onChange={handlePoliticianInputChange}
                  onKeyDown={handlePoliticianKeyDown}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isPoliticianLoading || politicianInput.length < 2}
                >
                  {isPoliticianLoading ? 'Searching...' : 'Search'}
                </Button>
              </form>

              {politicianInput.length > 0 && politicianInput.length < 2 && (
                <p className="text-sm text-amber-600 mt-2">
                  Please enter at least 2 characters to search
                </p>
              )}

              {politicianError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{politicianError}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="donor" className="mt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Find donors and explore their contribution history to politicians
              </p>
              <form onSubmit={handleDonorSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter donor name (minimum 3 characters, e.g., Boeing, AT&T)"
                  value={donorInput}
                  onChange={handleDonorInputChange}
                  onKeyDown={handleDonorKeyDown}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isDonorSearching || donorInput.length < 3}
                >
                  {isDonorSearching ? 'Searching...' : 'Search'}
                </Button>
              </form>

              {donorInput.length > 0 && donorInput.length < 3 && (
                <p className="text-sm text-amber-600 mt-2">
                  Please enter at least 3 characters to search
                </p>
              )}

              {donorSearchError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{donorSearchError}</p>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>

        {/* Politician Search Results with Suspense */}
        <TabsContent value="politician">
          {politicianQuery.length >= 2 ? (
            <Suspense fallback={
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    Searching for politicians...
                  </div>
                </CardContent>
              </Card>
            }>
              <PoliticianSearchResults
                searchQuery={politicianQuery}
                comparisonPoliticians={comparisonPoliticians}
                onSelectPolitician={selectPolitician}
                onToggleComparison={toggleComparison}
                onClearComparison={clearComparison}
              />
            </Suspense>
          ) : null}
        </TabsContent>

        {/* Donor Search Results with Suspense */}
        <TabsContent value="donor">
          {donorQuery.length >= 3 ? (
            <Suspense fallback={
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    Searching for donors...
                  </div>
                </CardContent>
              </Card>
            }>
              <DonorSearchResults
                searchQuery={donorQuery}
                onSelectDonor={selectDonor}
              />
            </Suspense>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
