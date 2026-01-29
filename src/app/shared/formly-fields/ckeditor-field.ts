import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { CKEditorModule, ChangeEvent } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-formly-ckeditor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, CKEditorModule],
  templateUrl: './ckeditor-field.html',
  styleUrls: ['./ckeditor-field.scss']
})
export class CKEditorFieldComponent extends FieldType<FieldTypeConfig> {
  Editor: any = ClassicEditor;

  editorConfig = {
    licenseKey: environment.ckeditorLicenseKey,
    toolbar: [
      'heading',
      '|',
      'bold',
      'italic',
      'link',
      'bulletedList',
      'numberedList',
      '|',
      'blockQuote',
      'undo',
      'redo'
    ]
  };

  onBlur() {
    this.formControl.markAsTouched();
  }

  override get showError(): boolean {
    return this.formControl.invalid && this.formControl.touched;
  }
}
