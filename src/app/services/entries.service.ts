import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Entry } from '../models/entry.model';

@Injectable({
  providedIn: 'root'
})
export class EntriesService {
  private mockEntries: Entry[] = [
    {
      id: '1',
      title: 'Decided to use Angular 20 standalone components',
      category: 'Decision',
      status: 'Final',
      createdAt: '2026-01-20T10:00:00Z'
    },
    {
      id: '2',
      title: 'Proposal: Add tagging system for entries',
      category: 'Proposal',
      status: 'Draft',
      createdAt: '2026-01-22T14:30:00Z'
    },
    {
      id: '3',
      title: 'Note: NGXS uses decorators for actions',
      category: 'Note',
      status: 'Final',
      createdAt: '2026-01-24T09:15:00Z'
    },
    {
      id: '4',
      title: 'Decided on Material UI for consistent design',
      category: 'Decision',
      status: 'Final',
      createdAt: '2026-01-25T16:45:00Z'
    }
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
      createdAt: new Date().toISOString()
    };
    return of(newEntry).pipe(delay(300));
  }

  // Simulate updating an entry
  updateEntry(id: string, updates: Partial<Entry>): Observable<Entry> {
    const entry = this.mockEntries.find(e => e.id === id);
    if (!entry) {
      throw new Error('Entry not found');
    }
    const updated = { ...entry, ...updates };
    return of(updated).pipe(delay(300));
  }
}