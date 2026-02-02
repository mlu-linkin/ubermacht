import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EntriesState } from '../../../store/state';
import { Entry } from '../../../models/entry.model';
import { LoadEntries, SelectEntry } from '../../../store/actions/entries.actions';

@Component({
  selector: 'app-entries-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './entries-list.html',
  styleUrls: ['./entries-list.scss'],
})
export class EntriesListComponent implements OnInit {
  // Observables from NGXS selectors
  entries$: Observable<Entry[]>;
  selectedEntryId$: Observable<string | null>;
  loading$: Observable<boolean>;

  constructor(
    private store: Store,
    private router: Router,
  ) {
    this.entries$ = this.store.select(EntriesState.entries);
    this.selectedEntryId$ = this.store.select(EntriesState.selectedEntryId);
    this.loading$ = this.store.select(EntriesState.loading);
  }

  ngOnInit() {
    // Dispatch action to load entries on component init
    this.store.dispatch(new LoadEntries());
  }

  onSelectEntry(entryId: string) {
    // Dispatch action to select entry
    this.store.dispatch(new SelectEntry(entryId));
  }

  onDeselectEntry() {
    this.store.dispatch(new SelectEntry(null));
  }

  getCategoryColor(category: Entry['category']): string {
    const colors = {
      Decision: 'primary',
      Note: 'accent',
      Proposal: 'warn',
    };
    return colors[category];
  }

  getStatusIcon(status: Entry['status']): string {
    return status === 'Final' ? 'check_circle' : 'edit';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  onCreateNew() {
    this.router.navigate(['/entries/new']);
  }

  onEditEntry(entryId: string, event: Event) {
    event.stopPropagation(); // Prevent card selection
    this.router.navigate(['/entries', entryId, 'edit']);
  }

  getContentPreview(content: string): string {
    // Strip HTML tags for preview
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || tempDiv.innerText || '';

    // Truncate to 150 characters
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  onViewEntry(entryId: string) {
    this.router.navigate(['/entries', entryId]);
  }
}
