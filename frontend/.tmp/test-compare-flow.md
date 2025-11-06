# Manual Test Plan for Compare Feature

## Test Case 1: Initial Compare Button Click
1. Search for a politician (e.g., "biden")
2. Click "Compare" button on any politician result
3. **Expected**: Button changes to "Selected" with filled style, checkbox appears
4. **Expected**: All other politicians still show "Compare" buttons

## Test Case 2: Select Second Politician
1. With one politician selected, click "Compare" on another politician
2. **Expected**: Comparison view displays with both politicians side-by-side
3. **Expected**: URL updates to include both politician IDs

## Test Case 3: Checkbox Selection
1. Search for a politician
2. Click "Compare" on first politician (enters comparison mode)
3. **Expected**: Checkboxes appear on all politician cards
4. Click checkbox on another politician
5. **Expected**: Both politicians selected, comparison view displays

## Test Case 4: Deselection
1. With one politician selected, click "Selected" button on that politician
2. **Expected**: Button changes back to "Compare", selection cleared
3. **Expected**: Checkboxes disappear (exit comparison mode)

## Test Case 5: Search and Compare
1. Search for first politician (e.g., "biden")
2. Click "Compare" on a result
3. Search for second politician (e.g., "trump")
4. Click "Compare" on a result from new search
5. **Expected**: Comparison view displays with both politicians
