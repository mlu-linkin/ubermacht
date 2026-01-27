import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { Store } from '@ngxs/store';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Entry } from '../../../models/entry.model';
import { AddEntry, UpdateEntry } from '../../../store/actions/entries.actions';

@Component({
  selector: 'app-entry-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormlyModule,
    FormlyMaterialModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './entry-from.html',
  styleUrls: ['./entry-from.scss'],
})
export class EntryFormComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() model?: Entry;

  form = new FormGroup({});
  formModel: any = {};
  fields: FormlyFieldConfig[] = [];
  isSubmitting = false;

  constructor(
    private store: Store,
    private router: Router,
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    // Set initial model values
    if (this.mode === 'edit' && this.model) {
      this.formModel = {
        title: this.model.title,
        category: this.model.category,
        status: this.model.status,
      };
    } else {
      this.formModel = {
        title: '',
        category: 'Note',
        status: 'Draft',
      };
    }

    // Define Formly field configuration
    this.fields = [
      {
        key: 'title',
        type: 'input',
        props: {
          label: 'Title',
          placeholder: 'Enter a clear, descriptive title',
          required: true,
          maxLength: 200,
        },
      },
      {
        key: 'category',
        type: 'select',
        props: {
          label: 'Category',
          required: true,
          options: [
            { label: 'Decision', value: 'Decision' },
            { label: 'Note', value: 'Note' },
            { label: 'Proposal', value: 'Proposal' },
          ],
        },
      },
      {
        key: 'status',
        type: 'select',
        props: {
          label: 'Status',
          required: true,
          options: [
            { label: 'Draft', value: 'Draft' },
            { label: 'Final', value: 'Final' },
          ],
        },
        expressions: {
          // Conditional: disable status when creating new entry
          'props.disabled': (field) => this.mode === 'create',
        },
        hooks: {
          onInit: (field) => {
            if (this.mode === 'create') {
              field.formControl?.setValue('Draft');
            }
          },
        },
      },
    ];
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    if (this.mode === 'create') {
      // Dispatch AddEntry action
      this.store
        .dispatch(
          new AddEntry({
            title: this.formModel.title,
            category: this.formModel.category,
            status: this.formModel.status,
          }),
        )
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.router.navigate(['/entries']);
          },
          error: () => {
            this.isSubmitting = false;
          },
        });
    } else if (this.mode === 'edit' && this.model) {
      // Dispatch UpdateEntry action
      this.store
        .dispatch(
          new UpdateEntry(this.model.id, {
            title: this.formModel.title,
            category: this.formModel.category,
            status: this.formModel.status,
          }),
        )
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.router.navigate(['/entries']);
          },
          error: () => {
            this.isSubmitting = false;
          },
        });
    }
  }

  onCancel() {
    this.router.navigate(['/entries']);
  }

  get isValid(): boolean {
    return this.form.valid;
  }

  get submitButtonText(): string {
    return this.mode === 'create' ? 'Create Entry' : 'Update Entry';
  }

  get pageTitle(): string {
    return this.mode === 'create' ? 'Create New Entry' : 'Edit Entry';
  }
}
