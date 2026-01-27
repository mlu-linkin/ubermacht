import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable, filter, map, take } from 'rxjs';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Entry } from '../../../models/entry.model';
import { LoadEntries } from '../../../store/actions/entries.actions';
import { EntryFormComponent } from '../entry-from/entry-from';
import { EntriesState } from '../../../store/state';

@Component({
  selector: 'app-edit-entry',
  standalone: true,
  imports: [
    CommonModule,
    EntryFormComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './edit-entry.html',
  styleUrls: ['./edit-entry.scss'],
})
export class EditEntryComponent implements OnInit {
  entries$: Observable<Entry[]>;
  entry$!: Observable<Entry | undefined>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store
  ) {
    this.entries$ = this.store.select(EntriesState.entries);
  }

  ngOnInit() {
    // Load entries if not already loaded
    this.store.dispatch(new LoadEntries());

    // Get entry by ID from route
    this.entry$ = this.route.paramMap.pipe(
      map(params => params.get('id')),
      filter(id => !!id),
      map(id => {
        const entries = this.store.selectSnapshot(EntriesState.entries);
        const entry = entries.find(e => e.id === id);
        
        if (!entry) {
          // Entry not found, navigate back
          this.router.navigate(['/entries']);
        }
        
        return entry;
      })
    );
  }
}