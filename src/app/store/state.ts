import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { Entry } from '../models/entry.model';
import { EntriesService } from '../services/entries.service';
import {
  LoadEntries,
  LoadEntriesSuccess,
  LoadEntriesFailure,
  SelectEntry,
  AddEntry,
  AddEntrySuccess,
  UpdateEntry,
  UpdateEntrySuccess
} from './actions/entries.actions';

export interface EntriesStateModel {
  entries: Entry[];
  selectedEntryId: string | null;
  loading: boolean;
}

@State<EntriesStateModel>({
  name: 'entries',
  defaults: {
    entries: [],
    selectedEntryId: null,
    loading: false
  }
})
@Injectable()
export class EntriesState {
  constructor(private entriesService: EntriesService) {}

  // Selectors - derive data from state
  @Selector()
  static entries(state: EntriesStateModel): Entry[] {
    return state.entries;
  }

  @Selector()
  static selectedEntryId(state: EntriesStateModel): string | null {
    return state.selectedEntryId;
  }

  @Selector()
  static selectedEntry(state: EntriesStateModel): Entry | null {
    if (!state.selectedEntryId) return null;
    return state.entries.find(e => e.id === state.selectedEntryId) || null;
  }

  @Selector()
  static loading(state: EntriesStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static entriesByCategory(state: EntriesStateModel) {
    return (category: Entry['category']) => 
      state.entries.filter(e => e.category === category);
  }

  // Actions - the only way to change state

  @Action(LoadEntries)
  loadEntries(ctx: StateContext<EntriesStateModel>) {
    ctx.patchState({ loading: true });
    return this.entriesService.loadEntries().pipe(
      tap(entries => {
        ctx.dispatch(new LoadEntriesSuccess(entries));
      }),
      catchError(error => {
        ctx.dispatch(new LoadEntriesFailure(error.message));
        return of(null);
      })
    );
  }

  @Action(LoadEntriesSuccess)
  loadEntriesSuccess(
    ctx: StateContext<EntriesStateModel>,
    action: LoadEntriesSuccess
  ) {
    ctx.patchState({
      entries: action.entries,
      loading: false
    });
  }

  @Action(LoadEntriesFailure)
  loadEntriesFailure(
    ctx: StateContext<EntriesStateModel>,
    action: LoadEntriesFailure
  ) {
    ctx.patchState({ loading: false });
    console.error('Failed to load entries:', action.error);
  }

  @Action(SelectEntry)
  selectEntry(
    ctx: StateContext<EntriesStateModel>,
    action: SelectEntry
  ) {
    ctx.patchState({
      selectedEntryId: action.entryId
    });
  }

  @Action(AddEntry)
  addEntry(
    ctx: StateContext<EntriesStateModel>,
    action: AddEntry
  ) {
    ctx.patchState({ loading: true });

    return this.entriesService.addEntry(action.entry).pipe(
      tap(entry => {
        ctx.dispatch(new AddEntrySuccess(entry));
      }),
      catchError(error => {
        ctx.patchState({ loading: false });
        return of(null);
      })
    );
  }

  @Action(AddEntrySuccess)
  addEntrySuccess(
    ctx: StateContext<EntriesStateModel>,
    action: AddEntrySuccess
  ) {
    const state = ctx.getState();
    ctx.patchState({
      entries: [...state.entries, action.entry],
      loading: false
    });
  }

  @Action(UpdateEntry)
  updateEntry(
    ctx: StateContext<EntriesStateModel>,
    action: UpdateEntry
  ) {
    ctx.patchState({ loading: true });

    return this.entriesService.updateEntry(action.id, action.updates).pipe(
      tap(entry => {
        ctx.dispatch(new UpdateEntrySuccess(entry));
      }),
      catchError(error => {
        ctx.patchState({ loading: false });
        return of(null);
      })
    );
  }

  @Action(UpdateEntrySuccess)
  updateEntrySuccess(
    ctx: StateContext<EntriesStateModel>,
    action: UpdateEntrySuccess
  ) {
    const state = ctx.getState();
    ctx.patchState({
      entries: state.entries.map(e => 
        e.id === action.entry.id ? action.entry : e
      ),
      loading: false
    });
  }
}