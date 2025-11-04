# Modern Routing System Migration Plan

## Executive Summary

Paper Trail currently uses React Router 7 for basic page-level navigation but manages complex UI states (politician details, comparisons, donor searches) entirely through component state and custom events. This plan outlines the migration to a modern, URL-based routing architecture that supports bookmarking, deep linking, and shareable URLs while maintaining backward compatibility with the existing event system.

## Current State Analysis

### Existing Route Structure
```
/                → PoliticianSearch component
/donor_search    → DonorSearch component
/feedback        → Feedback component
```

### Current Limitations

1. **No URL-based state** - Refreshing the page loses all search and selection state
2. **No deep linking** - Cannot share URLs to specific politician/donor details
3. **Browser back/forward don't work properly** - Detail views are component state, not routes
4. **Event-based workarounds** - Custom events used to communicate between CommandPalette and pages
5. **No query parameters** - Search queries not persisted in URL
6. **Comparison mode not linkable** - Cannot bookmark or share comparison views

### Current Navigation Patterns

**Pattern 1: Direct Navigation**
```tsx
navigate('/donor_search');
```

**Pattern 2: State-Based View Switching (No URL change)**
```tsx
if (isComparing) return <PoliticianComparison />;
if (selectedPolitician) return <PoliticianDetails />;
return <SearchInterface />;
```

**Pattern 3: Inter-Component Communication via Events**
```tsx
// Dispatch from CommandPalette
window.dispatchEvent(new CustomEvent('selectPoliticianFromCommand', {
  detail: politician
}));

// Listen in PoliticianSearch
window.addEventListener('selectPoliticianFromCommand', handleCommandSelection);
```

## Goals & Requirements

### User Requirements
- ✓ **Bookmarkability**: All views (search, details, comparison) should be bookmarkable
- ✓ **Deep Linking**: Share direct URLs to politicians, donors, searches, and comparisons
- ✓ **State Persistence**: Refreshing page preserves current view and selections
- ✓ **Minimal History**: Avoid cluttering browser history with every detail view
- ✓ **Browser Navigation**: Back/forward buttons work intuitively for major state changes

### Technical Requirements
- ✓ **Query-based Comparisons**: Support future multi-entity comparisons (`?ids=1,2,3`)
- ✓ **Hybrid Event System**: Keep events for backward compatibility, sync with URL state
- ✓ **Type Safety**: Full TypeScript typing for route parameters and query strings
- ✓ **SEO-friendly URLs**: Clean, readable URL structure
- ✓ **No Breaking Changes**: Maintain existing functionality during migration

## Proposed Route Structure

### New URL Architecture

```
# Politician Routes
/                                    → Politician search (landing page)
/politician/:id                      → Politician details view
/politician?search=warren            → Politician search with query parameter
/politician/compare?ids=1,2,3        → Multi-politician comparison (extensible)

# Donor Routes
/donor                               → Donor search page
/donor/:id                           → Donor details view
/donor?search=google                 → Donor search with query parameter

# Other Routes
/feedback                            → Feedback form (unchanged)
```

### URL Examples

```
# Direct access to politician
https://papertrail.app/politician/412

# Search results preserved
https://papertrail.app/politician?search=elizabeth+warren

# Two-politician comparison
https://papertrail.app/politician/compare?ids=412,300072

# Future: Multi-politician comparison
https://papertrail.app/politician/compare?ids=412,300072,300011,300081

# Donor details
https://papertrail.app/donor/D000000123

# Donor search
https://papertrail.app/donor?search=google+llc
```

## Technical Implementation

### Phase 1: Route Configuration & Infrastructure

#### 1.1 Update App.tsx Route Definition

**Current:**
```tsx
<Routes>
  <Route path="/" element={<PoliticianSearch />} />
  <Route path="/donor_search" element={<DonorSearch />} />
  <Route path="/feedback" element={<Feedback />} />
</Routes>
```

**New:**
```tsx
<Routes>
  {/* Politician routes */}
  <Route path="/" element={<PoliticianSearch />} />
  <Route path="/politician" element={<PoliticianSearch />} />
  <Route path="/politician/:id" element={<PoliticianSearch />} />
  <Route path="/politician/compare" element={<PoliticianSearch />} />

  {/* Donor routes */}
  <Route path="/donor" element={<DonorSearch />} />
  <Route path="/donor/:id" element={<DonorSearch />} />

  {/* Other routes */}
  <Route path="/feedback" element={<Feedback />} />
</Routes>
```

**Rationale**: All politician routes render `PoliticianSearch` component, which will handle conditional rendering based on URL parameters. This maintains component structure while enabling URL-based state.

#### 1.2 Create URL State Management Utilities

**File: `frontend/src/utils/routing.ts`**

```typescript
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

/**
 * Type-safe route parameters
 */
export interface RouteParams {
  id?: string;
}

/**
 * Type-safe query parameters
 */
export interface SearchQueryParams {
  search?: string;
}

export interface ComparisonQueryParams {
  ids: string; // Comma-separated list: "1,2,3"
}

/**
 * Parse comparison IDs from query parameter
 */
export function parseComparisonIds(idsParam: string | null): number[] {
  if (!idsParam) return [];
  return idsParam
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));
}

/**
 * Build comparison URL from politician IDs
 */
export function buildComparisonUrl(politicianIds: number[]): string {
  const ids = politicianIds.join(',');
  return `/politician/compare?ids=${ids}`;
}

/**
 * Build politician detail URL
 */
export function buildPoliticianUrl(politicianId: number): string {
  return `/politician/${politicianId}`;
}

/**
 * Build donor detail URL
 */
export function buildDonorUrl(donorId: string): string {
  return `/donor/${donorId}`;
}

/**
 * Build search URL with query parameter
 */
export function buildSearchUrl(
  entityType: 'politician' | 'donor',
  searchQuery?: string
): string {
  const basePath = entityType === 'politician' ? '/politician' : '/donor';
  if (!searchQuery) return basePath;
  return `${basePath}?search=${encodeURIComponent(searchQuery)}`;
}

/**
 * Custom hook for URL-based state management
 */
export function useRouteState() {
  const navigate = useNavigate();
  const params = useParams<RouteParams>();
  const [searchParams] = useSearchParams();

  return {
    // Route parameters
    entityId: params.id,

    // Query parameters
    searchQuery: searchParams.get('search') || undefined,
    comparisonIds: parseComparisonIds(searchParams.get('ids')),

    // Navigation helpers
    navigateToEntity: (id: number, entityType: 'politician' | 'donor') => {
      const url = entityType === 'politician'
        ? buildPoliticianUrl(id)
        : buildDonorUrl(id.toString());
      navigate(url, { replace: true }); // Minimal history
    },

    navigateToComparison: (ids: number[]) => {
      navigate(buildComparisonUrl(ids), { replace: true });
    },

    navigateToSearch: (entityType: 'politician' | 'donor', query?: string) => {
      navigate(buildSearchUrl(entityType, query));
    },

    navigateBack: () => {
      navigate(-1);
    }
  };
}
```

**Key Design Decisions:**
- `replace: true` for detail/comparison views to implement minimal history
- Type-safe parameter parsing with validation
- Centralized URL building to ensure consistency
- Extensible comparison format supports unlimited IDs

### Phase 2: Component Refactoring

#### 2.1 Update PoliticianSearch Component

**Current Flow:**
```
Component State → Conditional Rendering
```

**New Flow:**
```
URL Parameters → Component State Sync → Conditional Rendering
```

**Changes to `frontend/src/components/PoliticianSearch.tsx`:**

```typescript
import { useRouteState } from '../utils/routing';
import { useEffect } from 'react';

export default function PoliticianSearch() {
  const {
    politicians,
    selectedPolitician,
    isComparing,
    selectPolitician,
    startComparison,
    // ... other state
  } = usePoliticianSearch();

  const {
    entityId,
    searchQuery,
    comparisonIds,
    navigateToEntity,
    navigateToComparison,
    navigateToSearch
  } = useRouteState();

  // Hydrate state from URL on mount
  useEffect(() => {
    if (entityId) {
      // Load politician by ID from URL
      const politicianId = parseInt(entityId, 10);
      if (!isNaN(politicianId)) {
        selectPolitician(politicianId);
      }
    } else if (comparisonIds.length >= 2) {
      // Load comparison mode from URL
      startComparison(comparisonIds);
    } else if (searchQuery) {
      // Set search query from URL
      setSearchTerm(searchQuery);
    }
  }, [entityId, comparisonIds, searchQuery]);

  // Sync URL when politician is selected
  useEffect(() => {
    if (selectedPolitician && !entityId) {
      navigateToEntity(selectedPolitician.politicianid, 'politician');
    }
  }, [selectedPolitician, entityId, navigateToEntity]);

  // Sync URL when comparison starts
  useEffect(() => {
    if (isComparing && comparisonIds.length === 0) {
      const ids = getComparisonPoliticianIds(); // Get from comparison state
      navigateToComparison(ids);
    }
  }, [isComparing, comparisonIds, navigateToComparison]);

  // Keep event system for CommandPalette backward compatibility
  useEffect(() => {
    const handleCommandSelection = (event: Event) => {
      const customEvent = event as CustomEvent<Politician>;
      selectPolitician(customEvent.detail.politicianid);
      // URL will be updated by the effect above
    };

    window.addEventListener('selectPoliticianFromCommand', handleCommandSelection);
    return () => {
      window.removeEventListener('selectPoliticianFromCommand', handleCommandSelection);
    };
  }, [selectPolitician]);

  // ... rest of component
}
```

**Key Changes:**
1. URL is source of truth for state
2. Component state syncs with URL via effects
3. Events still work but trigger URL updates
4. `replace: true` ensures minimal history

#### 2.2 Update DonorSearch Component

Apply similar pattern to `frontend/src/components/DonorSearch.tsx`:

```typescript
export default function DonorSearch() {
  const { entityId, searchQuery, navigateToEntity, navigateToSearch } = useRouteState();

  // Hydrate from URL
  useEffect(() => {
    if (entityId) {
      selectDonor(entityId);
    } else if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [entityId, searchQuery]);

  // Sync to URL
  useEffect(() => {
    if (selectedDonor && !entityId) {
      navigateToEntity(selectedDonor.donorid, 'donor');
    }
  }, [selectedDonor, entityId]);

  // Event system compatibility
  useEffect(() => {
    const handleCommandSelection = (event: Event) => {
      const customEvent = event as CustomEvent<Donor>;
      selectDonor(customEvent.detail.donorid);
    };

    window.addEventListener('selectDonorFromCommand', handleCommandSelection);
    return () => {
      window.removeEventListener('selectDonorFromCommand', handleCommandSelection);
    };
  }, [selectDonor]);
}
```

#### 2.3 Update CommandPalette Component

**Changes to `frontend/src/components/CommandPalette.tsx`:**

```typescript
import { buildPoliticianUrl, buildDonorUrl } from '../utils/routing';

export default function CommandPalette() {
  const navigate = useNavigate();

  const handleSelectPolitician = useCallback((politician: Politician) => {
    setOpen(false);

    // Navigate to politician detail URL
    navigate(buildPoliticianUrl(politician.politicianid), { replace: true });

    // Also dispatch event for backward compatibility
    window.dispatchEvent(
      new CustomEvent('selectPoliticianFromCommand', { detail: politician })
    );
  }, [navigate]);

  const handleSelectDonor = useCallback((donor: Donor) => {
    setOpen(false);

    // Navigate to donor detail URL
    navigate(buildDonorUrl(donor.donorid), { replace: true });

    // Also dispatch event for backward compatibility
    window.dispatchEvent(
      new CustomEvent('selectDonorFromCommand', { detail: donor })
    );
  }, [navigate]);

  // ... rest of component
}
```

**Key Changes:**
- Navigate with proper URL structure
- Keep event dispatch for backward compatibility
- Use `replace: true` for minimal history

#### 2.4 Update Header Component

**Changes to `frontend/src/components/Header.tsx`:**

```typescript
export default function Header() {
  return (
    <header>
      <nav>
        <NavLink
          to="/politician"  // Changed from "/"
          className={({ isActive }) =>
            isActive ? 'font-bold underline' : 'hover:underline'
          }
        >
          Politicians
        </NavLink>

        <NavLink
          to="/donor"  // Changed from "/donor_search"
          className={({ isActive }) =>
            isActive ? 'font-bold underline' : 'hover:underline'
          }
        >
          Donors
        </NavLink>

        <NavLink to="/feedback" className={...}>
          Feedback
        </NavLink>
      </nav>
    </header>
  );
}
```

**Rationale**: Update to new URL structure (`/donor` instead of `/donor_search`)

### Phase 3: Search State Synchronization

#### 3.1 Sync Search Input with URL

**Add to PoliticianSearch and DonorSearch:**

```typescript
const [searchTerm, setSearchTerm] = useState('');
const { searchQuery, navigateToSearch } = useRouteState();

// Initialize from URL
useEffect(() => {
  if (searchQuery) {
    setSearchTerm(searchQuery);
  }
}, [searchQuery]);

// Debounced URL update when typing
const debouncedNavigate = useMemo(
  () =>
    debounce((query: string) => {
      if (query.length >= 3) {
        navigateToSearch('politician', query);
      } else if (query.length === 0) {
        navigateToSearch('politician'); // Clear search param
      }
    }, 500),
  [navigateToSearch]
);

const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setSearchTerm(value);
  debouncedNavigate(value);
};
```

**Helper Function (`frontend/src/utils/debounce.ts`):**

```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

**Key Design Decision**: Debounce URL updates to avoid excessive history entries during typing.

### Phase 4: Comparison Mode Implementation

#### 4.1 Query-Based Comparison URLs

**In PoliticianComparison Component:**

```typescript
import { useRouteState } from '../utils/routing';

export default function PoliticianComparison() {
  const { comparisonIds, navigateToComparison, navigateBack } = useRouteState();
  const [politicians, setPoliticians] = useState<Politician[]>([]);

  // Load politicians from URL IDs
  useEffect(() => {
    if (comparisonIds.length >= 2) {
      loadPoliticians(comparisonIds);
    }
  }, [comparisonIds]);

  const handleAddPolitician = (politicianId: number) => {
    const newIds = [...comparisonIds, politicianId];
    navigateToComparison(newIds);
  };

  const handleRemovePolitician = (politicianId: number) => {
    const newIds = comparisonIds.filter(id => id !== politicianId);
    if (newIds.length < 2) {
      navigateBack(); // Exit comparison mode
    } else {
      navigateToComparison(newIds);
    }
  };

  return (
    <div>
      {/* Render comparison UI */}
      <button onClick={() => handleAddPolitician(newId)}>
        Add Another Politician
      </button>
    </div>
  );
}
```

**Future Extensibility**: This query-based approach naturally supports 3+, 4+, or unlimited politician comparisons.

### Phase 5: Testing Strategy

#### 5.1 Unit Tests

**File: `frontend/src/utils/routing.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  parseComparisonIds,
  buildComparisonUrl,
  buildPoliticianUrl,
  buildDonorUrl,
  buildSearchUrl
} from './routing';

describe('routing utilities', () => {
  describe('parseComparisonIds', () => {
    it('parses comma-separated IDs', () => {
      expect(parseComparisonIds('1,2,3')).toEqual([1, 2, 3]);
    });

    it('handles whitespace', () => {
      expect(parseComparisonIds('1, 2, 3')).toEqual([1, 2, 3]);
    });

    it('filters invalid IDs', () => {
      expect(parseComparisonIds('1,invalid,3')).toEqual([1, 3]);
    });

    it('returns empty array for null', () => {
      expect(parseComparisonIds(null)).toEqual([]);
    });
  });

  describe('URL builders', () => {
    it('builds politician URL', () => {
      expect(buildPoliticianUrl(412)).toBe('/politician/412');
    });

    it('builds comparison URL', () => {
      expect(buildComparisonUrl([1, 2, 3])).toBe('/politician/compare?ids=1,2,3');
    });

    it('builds search URL with query', () => {
      expect(buildSearchUrl('politician', 'warren')).toBe('/politician?search=warren');
    });

    it('builds search URL without query', () => {
      expect(buildSearchUrl('donor')).toBe('/donor');
    });
  });
});
```

#### 5.2 Integration Tests

**Test Scenarios:**

1. **Direct URL Access**
   - Navigate to `/politician/412` → Politician details load
   - Navigate to `/donor/D000000123` → Donor details load
   - Navigate to `/politician/compare?ids=1,2` → Comparison view loads

2. **URL State Persistence**
   - Select politician → URL updates → Refresh → State preserved
   - Enter search → URL updates → Refresh → Search term preserved
   - Start comparison → URL updates → Refresh → Comparison preserved

3. **Browser Navigation**
   - Back button from detail view → Returns to search
   - Forward button → Returns to detail view
   - Back from comparison → Returns to previous view

4. **Bookmarking & Sharing**
   - Copy URL from detail view → Paste in new tab → Same view loads
   - Copy comparison URL → Share → Recipient sees same comparison

5. **Backward Compatibility**
   - CommandPalette selection still works
   - Event system still triggers
   - Old `/donor_search` URLs redirect to `/donor`

#### 5.3 Manual Testing Checklist

```
[ ] Direct navigation to /politician/412 loads politician details
[ ] Direct navigation to /donor/D000000123 loads donor details
[ ] Direct navigation to /politician/compare?ids=1,2,3 loads comparison
[ ] Search query persists in URL and survives refresh
[ ] Browser back button works from detail → search
[ ] Browser forward button works from search → detail
[ ] Bookmarking politician detail URL works
[ ] Bookmarking comparison URL works
[ ] CommandPalette politician selection updates URL
[ ] CommandPalette donor selection updates URL
[ ] Comparison mode supports 2+ politicians
[ ] Adding politician to comparison updates URL
[ ] Removing politician from comparison updates URL
[ ] Exiting comparison (< 2 politicians) navigates back
[ ] URL encoding handles special characters in search
[ ] Invalid politician ID shows error/404 state
[ ] Browser history is not cluttered (minimal entries)
```

### Phase 6: Migration Path

#### 6.1 Step-by-Step Implementation

**Step 1: Add Routing Utilities**
- Create `frontend/src/utils/routing.ts`
- Create `frontend/src/utils/debounce.ts`
- Add unit tests

**Step 2: Update Route Configuration**
- Modify `App.tsx` with new routes
- Add redirect from `/donor_search` → `/donor`
- Test basic navigation

**Step 3: Update PoliticianSearch**
- Integrate `useRouteState` hook
- Add URL hydration effects
- Add URL sync effects
- Test politician detail URLs

**Step 4: Update DonorSearch**
- Apply same pattern as PoliticianSearch
- Test donor detail URLs

**Step 5: Update CommandPalette**
- Update navigation to use URL builders
- Keep event dispatch for backward compatibility
- Test global search

**Step 6: Update Header**
- Change NavLink paths
- Test navigation between pages

**Step 7: Implement Search State Sync**
- Add debounced URL updates
- Test search persistence

**Step 8: Implement Comparison Mode**
- Update PoliticianComparison component
- Test multi-politician URLs
- Test add/remove functionality

**Step 9: Comprehensive Testing**
- Run all unit tests
- Run all integration tests
- Complete manual testing checklist

**Step 10: Documentation**
- Update README with URL structure
- Document URL parameters
- Add examples

#### 6.2 Rollback Strategy

If issues arise during migration:

1. **Revert commits** - Each phase is a separate commit
2. **Feature flag** - Wrap new routing in feature flag for gradual rollout
3. **Parallel implementation** - Keep old component state system while testing new URL system

### Phase 7: Performance Considerations

#### 7.1 Optimizations

**Avoid Unnecessary Renders:**
```typescript
// Memoize URL builders
const politicianUrl = useMemo(
  () => selectedPolitician ? buildPoliticianUrl(selectedPolitician.id) : null,
  [selectedPolitician]
);

// Debounce search URL updates
const debouncedNavigate = useMemo(
  () => debounce(navigateToSearch, 500),
  [navigateToSearch]
);
```

**Lazy Load Detail Components:**
```typescript
const PoliticianDetails = lazy(() => import('./PoliticianDetails'));
const DonorDetails = lazy(() => import('./DonorDetails'));

// In component
{selectedPolitician && (
  <Suspense fallback={<LoadingSpinner />}>
    <PoliticianDetails politician={selectedPolitician} />
  </Suspense>
)}
```

#### 7.2 URL Length Considerations

**Comparison Mode Limits:**
- Browser URL length limit: ~2,000 characters
- Average politician ID length: 6 characters
- Theoretical max politicians in URL: ~300
- Practical limit: 20-30 politicians

**Mitigation for Large Comparisons:**
- Show warning at 10+ politicians
- Alternative: Store comparison in backend, use short hash in URL

## Benefits Summary

### User Benefits
✓ **Shareable URLs** - Send links to specific politicians, donors, or comparisons
✓ **Bookmarkable Views** - Bookmark any view for quick access later
✓ **State Persistence** - Refreshing page doesn't lose your place
✓ **Intuitive Navigation** - Browser back/forward work as expected
✓ **Deep Linking** - Direct access to any content via URL

### Developer Benefits
✓ **Type Safety** - TypeScript types for all route parameters
✓ **Maintainability** - Centralized URL building logic
✓ **Testability** - URL state is easier to test than component state
✓ **Debuggability** - URL shows current state clearly
✓ **Extensibility** - Easy to add new routes/parameters

### Technical Benefits
✓ **SEO-friendly** - Clean, readable URLs
✓ **Analytics-friendly** - Track page views by URL
✓ **Backward Compatible** - Event system still works
✓ **Future-proof** - Query-based comparisons support unlimited entities
✓ **Standards Compliant** - Uses React Router best practices

## Timeline & Effort Estimate

### Implementation Phases
- **Phase 1**: Route Configuration (2-3 hours)
- **Phase 2**: Component Refactoring (4-6 hours)
- **Phase 3**: Search State Sync (2-3 hours)
- **Phase 4**: Comparison Mode (3-4 hours)
- **Phase 5**: Testing (4-6 hours)
- **Phase 6**: Documentation (1-2 hours)

**Total Estimated Effort**: 16-24 hours

### Risk Mitigation
- Incremental commits allow easy rollback
- Backward compatibility minimizes breaking changes
- Comprehensive testing catches edge cases
- Feature flags enable gradual rollout

## Appendix

### A. Type Definitions

```typescript
// frontend/src/types/routing.ts

export interface Politician {
  politicianid: number;
  name: string;
  party: string;
  state: string;
}

export interface Donor {
  donorid: string;
  name: string;
  donortype: string;
  employer?: string;
  state: string;
}

export interface RouteParams {
  id?: string;
}

export interface SearchQueryParams {
  search?: string;
}

export interface ComparisonQueryParams {
  ids: string;
}

export type EntityType = 'politician' | 'donor';

export interface RouteState {
  entityId?: string;
  searchQuery?: string;
  comparisonIds: number[];
  navigateToEntity: (id: number, entityType: EntityType) => void;
  navigateToComparison: (ids: number[]) => void;
  navigateToSearch: (entityType: EntityType, query?: string) => void;
  navigateBack: () => void;
}
```

### B. URL Patterns Reference

| Pattern | Example | Use Case |
|---------|---------|----------|
| `/politician` | `/politician` | Politician search landing |
| `/politician?search={query}` | `/politician?search=warren` | Search results |
| `/politician/:id` | `/politician/412` | Politician details |
| `/politician/compare?ids={ids}` | `/politician/compare?ids=412,300072` | Comparison view |
| `/donor` | `/donor` | Donor search landing |
| `/donor?search={query}` | `/donor?search=google` | Donor search results |
| `/donor/:id` | `/donor/D000000123` | Donor details |

### C. Browser History Behavior

```
# User Flow Example
1. User lands on /politician
   → History: [/politician]

2. User searches "warren"
   → History: [/politician, /politician?search=warren]

3. User clicks Elizabeth Warren
   → History: [/politician, /politician?search=warren] (replace: true)
   → URL: /politician/412

4. User clicks back button
   → History: [/politician, /politician?search=warren]
   → URL: /politician?search=warren

5. User clicks forward button
   → History: [/politician, /politician?search=warren]
   → URL: /politician/412
```

**Note**: Detail views use `replace: true` to avoid cluttering history, achieving "minimal history" requirement.

### D. Event System Compatibility

The hybrid approach maintains events while making URLs the source of truth:

```typescript
// CommandPalette dispatches event + navigates
navigate(buildPoliticianUrl(id), { replace: true });
window.dispatchEvent(new CustomEvent('selectPoliticianFromCommand', { detail }));

// PoliticianSearch listens to event
window.addEventListener('selectPoliticianFromCommand', (e) => {
  selectPolitician(e.detail.politicianid);
  // Effect will sync URL if not already updated
});

// URL effect syncs state
useEffect(() => {
  if (entityId) selectPolitician(parseInt(entityId));
}, [entityId]);
```

**Result**: Both systems work together. URL changes trigger state changes, and state changes trigger URL updates. Events still work for backward compatibility.

## Conclusion

This migration plan provides a comprehensive roadmap to modernize Paper Trail's routing system while maintaining backward compatibility. The proposed architecture supports all modern web app expectations (bookmarking, deep linking, state persistence) while preparing the application for future enhancements like multi-entity comparisons and advanced filtering.

The query-based comparison system (`?ids=1,2,3`) is particularly future-proof, allowing unlimited politicians in comparisons without architectural changes. The hybrid event system ensures existing functionality continues to work during and after migration.

By following this phased approach with comprehensive testing, the migration can be completed safely with minimal risk of breaking changes.
