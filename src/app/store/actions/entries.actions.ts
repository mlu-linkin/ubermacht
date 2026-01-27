import { Entry } from '../../models/entry.model';

// Action class naming convention: [Feature] Action Name
export class LoadEntries {
  static readonly type = '[Entries] Load Entries';
}

export class LoadEntriesSuccess {
  static readonly type = '[Entries] Load Entries Success';
  constructor(public entries: Entry[]) {}
}

export class LoadEntriesFailure {
  static readonly type = '[Entries] Load Entries Failure';
  constructor(public error: string) {}
}

export class SelectEntry {
  static readonly type = '[Entries] Select Entry';
  constructor(public entryId: string | null) {}
}

export class AddEntry {
  static readonly type = '[Entries] Add Entry';
  constructor(public entry: Omit<Entry, 'id' | 'createdAt'>) {}
}

export class AddEntrySuccess {
  static readonly type = '[Entries] Add Entry Success';
  constructor(public entry: Entry) {}
}

export class UpdateEntry {
  static readonly type = '[Entries] Update Entry';
  constructor(public id: string, public updates: Partial<Entry>) {}
}

export class UpdateEntrySuccess {
  static readonly type = '[Entries] Update Entry Success';
  constructor(public entry: Entry) {}
}