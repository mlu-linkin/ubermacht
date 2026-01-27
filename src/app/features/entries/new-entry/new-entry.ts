import { Component } from '@angular/core';
import { EntryFormComponent } from '../entry-from/entry-from';

@Component({
  selector: 'app-new-entry',
  standalone: true,
  imports: [EntryFormComponent],
  templateUrl: './new-entry.html',
  styleUrls: ['./new-entry.scss']
})
export class NewEntryComponent {}
