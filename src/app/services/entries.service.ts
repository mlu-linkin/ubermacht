import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Entry } from '../models/entry.model';

@Injectable({
  providedIn: 'root',
})
export class EntriesService {
  private mockEntries: Entry[] = [
    {
      id: '1',
      title: 'Decided to use Angular 20 standalone components',
      category: 'Decision',
      status: 'Final',
      content:
        '<h2>Context</h2><p>We evaluated Angular module-based vs standalone architecture.</p><h2>Decision</h2><p>Use standalone components exclusively for better tree-shaking and simpler mental model.</p>',
      createdAt: '2026-01-20T10:00:00Z',
    },
    {
      id: '2',
      title: 'Proposal: Add tagging system for entries',
      category: 'Proposal',
      status: 'Draft',
      content:
        '<p>We should add tags to entries to enable better filtering and organization.</p><ul><li>Support multiple tags per entry</li><li>Tag autocomplete</li><li>Tag-based search</li></ul>',
      createdAt: '2026-01-22T14:30:00Z',
    },
    {
      id: '3',
      title: 'Note: NGXS uses decorators for actions',
      category: 'Note',
      status: 'Final',
      content:
        '<p>Unlike NgRx which uses plain objects, NGXS actions are <strong>classes with static type properties</strong>.</p><p>This enables better TypeScript support and payload passing through constructors.</p>',
      createdAt: '2026-01-24T09:15:00Z',
    },
    {
      id: '4',
      title: 'Decided on Material UI for consistent design',
      category: 'Decision',
      status: 'Final',
      content:
        '<h2>Options Considered</h2><ul><li>Angular Material</li><li>PrimeNG</li><li>Custom CSS</li></ul><h2>Choice</h2><p>Angular Material provides the best TypeScript integration and maintenance commitment from the Angular team.</p>',
      createdAt: '2026-01-25T16:45:00Z',
    },
  ];

  // Simulate network delay
  loadEntries(): Observable<Entry[]> {
    return of([...this.mockEntries]).pipe(delay(500));
  }

  // Simulate adding an entry
  addEntry(entry: Omit<Entry, 'id' | 'createdAt'>): Observable<Entry> {
    const newEntry: Entry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    this.mockEntries.push(newEntry);
    return of(newEntry).pipe(delay(300));
  }

  // Simulate updating an entry
  updateEntry(id: string, updates: Partial<Entry>): Observable<Entry> {
    const entry = this.mockEntries.find((e) => e.id === id);
    if (!entry) {
      throw new Error('Entry not found');
    }
    const updated = { ...entry, ...updates };
    return of(updated).pipe(delay(300));
  }
}
