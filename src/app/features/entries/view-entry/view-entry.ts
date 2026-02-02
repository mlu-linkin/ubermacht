import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store, Select } from '@ngxs/store';
import { Observable, filter, map } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Entry } from '../../../models/entry.model';
import { LoadEntries } from '../../../store/actions/entries.actions';
import { EntriesState } from '../../../store/state';

@Component({
  selector: 'app-view-entry',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './view-entry.html',
  styleUrl: './view-entry.scss',
})
export class ViewEntryComponent implements OnInit {
  @Select(EntriesState.entries) entries$!: Observable<Entry[]>;
  entry$!: Observable<Entry | undefined>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
  ) {}

  ngOnInit() {
    // Load entries if not already loaded
    this.store.dispatch(new LoadEntries());

    // Get entry by ID from route
    this.entry$ = this.route.paramMap.pipe(
      map((params) => params.get('id')),
      filter((id) => !!id),
      map((id) => {
        const entries = this.store.selectSnapshot(EntriesState.entries);
        const entry = entries.find((e) => e.id === id);

        if (!entry) {
          // Entry not found, navigate back
          this.router.navigate(['/entries']);
        }

        return entry;
      }),
    );
  }

  onEdit(entryId: string) {
    this.router.navigate(['/entries', entryId, 'edit']);
  }

  onBack() {
    this.router.navigate(['/entries']);
  }

  getCategoryColor(category: Entry['category']): string {
    const colors = {
      Decision: 'primary',
      Note: 'accent',
      Proposal: 'warn',
    };
    return colors[category];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
