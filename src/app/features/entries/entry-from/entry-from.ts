import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FormlyModule, FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { Store } from '@ngxs/store';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Entry } from '../../../models/entry.model';
import { AddEntry, UpdateEntry } from '../../../store/actions/entries.actions';
import { NotificationService } from '../../../services/notification.service';

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
  options: FormlyFormOptions = {};
  isSubmitting = false;

  constructor(
    private store: Store,
    private router: Router,
    private notification: NotificationService,
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
        content: this.model.content, // NEW - rehydrate content
      };
    } else {
      this.formModel = {
        title: '',
        category: 'Note',
        status: 'Draft',
        content: '', // NEW - empty content for new entries
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
      // NEW - Content field using custom CKEditor type
      {
        key: 'content',
        type: 'ckeditor',
        props: {
          label: 'Content',
          required: true,
        },
      },
    ];
  }

  onSubmit() {
    // Validate form
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.showError('Please fill in all required fields');
      return;
    }

    // Prevent double-submit
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    // Dispatch action with proper error handling
    if (this.mode === 'create') {
      // Dispatch AddEntry action
      this.store
        .dispatch(
          new AddEntry({
            title: this.formModel.title,
            category: this.formModel.category,
            status: this.formModel.status,
            content: this.formModel.content
          }),
        )
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.notification.showSuccess('Entry created successfully');
            this.router.navigate(['/entries']);
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('Failed to create entry:', error);
            this.notification.showError('Failed to create entry. Please try again.');
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
            content: this.formModel.content
          }),
        )
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.notification.showSuccess('Entry updated successfully');
            this.router.navigate(['/entries']);
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('Failed to update entry:', error);
            this.notification.showError('Failed to update entry. Please try again.');
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
