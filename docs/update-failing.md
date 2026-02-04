# Update Button Not Persisting Issue - Investigation Report

**Date:** February 4, 2026  
**Status:** Issue Identified

## Problem Summary
The update button in the edit entry form is not persisting changes to entries. While the update flow appears to execute successfully (showing success notifications), the changes are not reflected when viewing the entry list or entry details.

## Root Cause
**Critical Bug in `EntriesService.updateEntry()` method**

The `updateEntry()` method in [src/app/services/entries.service.ts](../src/app/services/entries.service.ts#L60-L67) does not actually update the mock data store:

```typescript
updateEntry(id: string, updates: Partial<Entry>): Observable<Entry> {
  const entry = this.mockEntries.find((e) => e.id === id);
  if (!entry) {
    throw new Error('Entry not found');
  }
  const updated = { ...entry, ...updates };
  return of(updated).pipe(delay(300));
}
```

**The Problem:** 
- The method creates an `updated` object with the merged changes
- It returns this updated object to the caller
- **BUT** it never updates the `this.mockEntries` array
- This means the in-memory data store remains unchanged

## Evidence Trail

### 1. Form Component ([entry-from.ts](../src/app/features/entries/entry-from/entry-from.ts#L157-L188))
✅ Correctly dispatches `UpdateEntry` action with all form data:
```typescript
this.store.dispatch(
  new UpdateEntry(this.model.id, {
    title: this.formModel.title,
    category: this.formModel.category,
    status: this.formModel.status,
    content: this.formModel.content
  })
)
```

### 2. State Management ([state.ts](../src/app/store/state.ts#L178-L206))
✅ Correctly handles the update:
- Calls `entriesService.updateEntry()`
- Dispatches `UpdateEntrySuccess` with returned entry
- Updates state by mapping over entries array and replacing the matching entry

### 3. Service Layer ([entries.service.ts](../src/app/services/entries.service.ts#L60-L67))
❌ **FAILS TO PERSIST**: Does not update `this.mockEntries` array

## Impact
- Users see success notifications but changes are not saved
- Navigating away and returning shows the old data
- The issue affects ALL entry updates regardless of which fields are changed
- The problem is invisible to the state management layer (which receives a properly updated object but doesn't know the source data wasn't modified)

## Solution
The `updateEntry()` method must update the `this.mockEntries` array before returning:

```typescript
updateEntry(id: string, updates: Partial<Entry>): Observable<Entry> {
  const index = this.mockEntries.findIndex((e) => e.id === id);
  if (index === -1) {
    throw new Error('Entry not found');
  }
  
  // Update the mock data store
  this.mockEntries[index] = {
    ...this.mockEntries[index],
    ...updates
  };
  
  return of(this.mockEntries[index]).pipe(delay(300));
}
```

## Testing Recommendations
After applying the fix:
1. Edit an existing entry
2. Change multiple fields (title, category, status, content)
3. Click "Update Entry"
4. Navigate back to entries list
5. Verify changes are visible in the list view
6. Open the entry details/edit again
7. Verify all fields show the updated values

## Related Files
- [src/app/services/entries.service.ts](../src/app/services/entries.service.ts) - Contains the bug
- [src/app/features/entries/entry-from/entry-from.ts](../src/app/features/entries/entry-from/entry-from.ts) - Form component (working correctly)
- [src/app/store/state.ts](../src/app/store/state.ts) - State management (working correctly)
- [src/app/store/actions/entries.actions.ts](../src/app/store/actions/entries.actions.ts) - Action definitions (working correctly)
