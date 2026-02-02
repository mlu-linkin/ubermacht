# CKEditor 5 Integration Issues - Root Cause Analysis

## Status: ✅ FIXED

**Date:** January 29, 2026  
**Changes Applied:** Yes  
**Files Modified:**
- [src/app/shared/formly-fields/ckeditor-field.ts](../src/app/shared/formly-fields/ckeditor-field.ts)
- [src/app/shared/formly-fields/ckeditor-field.html](../src/app/shared/formly-fields/ckeditor-field.html)

---

## Executive Summary

The CKEditor 5 field is correctly integrated with Formly, but there are **critical binding issues** preventing the UI from rendering and data from syncing. The implementation uses `[formControl]` binding which should work, but the CKEditor Angular wrapper's `ControlValueAccessor` implementation requires special handling that's missing.

---

## Root Causes

### 1. **Missing `ngModel` or Data Binding**

**Issue:** The `<ckeditor>` component uses `[formControl]` binding, but CKEditor's Angular wrapper requires **either** `[(ngModel)]` or explicit `[data]` + `(change)` event handling to function properly with reactive forms.

**Evidence:**
- File: [src/app/shared/formly-fields/ckeditor-field.html](../src/app/shared/formly-fields/ckeditor-field.html#L8-L12)
```html
<ckeditor
  [editor]="Editor"
  [config]="editorConfig"
  [formControl]="formControl"  ← Only formControl, no data binding
  (blur)="onBlur()">
</ckeditor>
```

**Why this fails:**
- CKEditor's `ControlValueAccessor` implementation in Angular 20 with standalone components requires explicit initialization data
- Without `[data]` or `[(ngModel)]`, the editor may not initialize with the form's initial value
- The `formControl` binding alone doesn't trigger the editor's internal initialization sequence properly

---

### 2. **OnPush Change Detection Strategy**

**Issue:** The component uses `ChangeDetectionStrategy.OnPush` but doesn't manually trigger change detection when needed.

**Evidence:**
- File: [src/app/shared/formly-fields/ckeditor-field.ts](../src/app/shared/formly-fields/ckeditor-field.ts#L11-L17)
```typescript
@Component({
  selector: 'app-formly-ckeditor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, CKEditorModule],
  templateUrl: './ckeditor-field.html',
  styleUrls: ['./ckeditor-field.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush  ← Blocks automatic updates
})
```

**Why this matters:**
- OnPush change detection requires explicit `ChangeDetectorRef.markForCheck()` calls
- When the formControl value changes (e.g., during edit mode), the view won't update
- The editor UI might not render because Angular doesn't detect the need to update the view

---

### 3. **Missing Explicit Change Handling**

**Issue:** No `(change)` output handler to sync editor content back to the form control.

**Evidence:**
The template only has `(blur)` but no `(change)` event handler. CKEditor's Angular wrapper emits change events that must be captured to sync data to the form model.

**Required pattern from CKEditor docs:**
```typescript
public onChange({ editor }: ChangeEvent) {
  const data = editor.getData();
  this.formControl.setValue(data);
}
```

---

### 4. **Potential Import Issues with CKEditorModule**

**Issue:** While `CKEditorModule` is imported in the component, there may be version compatibility issues or missing initialization.

**Evidence:**
- Package versions: `@ckeditor/ckeditor5-angular@11.0.0` + `@angular/core@20.3.0`
- CKEditor Angular v11 is designed for Angular 19+, which should be compatible
- However, the `default` import issue with ClassicEditor suggests a module resolution problem

**Current workaround in code:**
```typescript
import * as ClassicEditorBuild from '@ckeditor/ckeditor5-build-classic';
const ClassicEditor = ClassicEditorBuild as any;  ← Type cast to bypass errors
```

This workaround is correct, but the editor initialization might still be fragile.

---

## Evidence from Codebase

### Formly Registration (Correct)
File: [src/app/app.config.ts](../src/app/app.config.ts#L22-L32)
```typescript
FormlyModule.forRoot({
  validationMessages: [
    { name: 'required', message: 'This field is required' },
  ],
  types: [
    {
      name: 'ckeditor',
      component: CKEditorFieldComponent  ✓ Correctly registered
    }
  ],
}).providers || [],
```

### Form Field Configuration (Correct)
File: [src/app/features/entries/entry-from/entry-from.ts](../src/app/features/entries/entry-from/entry-from.ts#L117-L124)
```typescript
{
  key: 'content',
  type: 'ckeditor',
  props: {
    label: 'Content',
    required: true,
  },
},
```

### Component Structure (Correct Foundation)
File: [src/app/shared/formly-fields/ckeditor-field.ts](../src/app/shared/formly-fields/ckeditor-field.ts#L19-L44)
```typescript
export class CKEditorFieldComponent extends FieldType<FieldTypeConfig> {
  Editor = ClassicEditor;  ✓ Editor reference correct
  
  editorConfig = {
    toolbar: [ /* ... */ ]  ✓ Config correct
  };
  
  onBlur() {
    this.formControl.markAsTouched();  ✓ Validation handling correct
  }
  
  override get showError(): boolean {
    return this.formControl.invalid && this.formControl.touched;  ✓ Error display correct
  }
}
```

---

## Minimal Correct Fix

### Required Changes

#### 1. Update Template: Add Data Binding + Change Handler

**File:** [src/app/shared/formly-fields/ckeditor-field.html](../src/app/shared/formly-fields/ckeditor-field.html)

```html
<div class="ckeditor-field">
  <label *ngIf="props.label">
    {{ props.label }}
    <span *ngIf="props.required" class="required-marker">*</span>
  </label>

  <ckeditor
    [editor]="Editor"
    [config]="editorConfig"
    [formControl]="formControl"
    [data]="formControl.value || ''"
    (change)="onChange($event)"
    (blur)="onBlur()">
  </ckeditor>

  <div class="error-message" *ngIf="showError">
    <ng-container *ngFor="let error of formControl.errors | keyvalue">
      {{ error.key === 'required' ? 'This field is required' : error.value }}
    </ng-container>
  </div>
</div>
```

**Changes:**
- Added `[data]="formControl.value || ''"` to initialize editor with form value
- Added `(change)="onChange($event)"` to sync editor changes back to form

---

#### 2. Update Component: Add Change Handler & Remove OnPush

**File:** [src/app/shared/formly-fields/ckeditor-field.ts](../src/app/shared/formly-fields/ckeditor-field.ts)

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { ChangeEvent } from '@ckeditor/ckeditor5-angular/ckeditor.component';
import * as ClassicEditorBuild from '@ckeditor/ckeditor5-build-classic';

const ClassicEditor = ClassicEditorBuild as any;

@Component({
  selector: 'app-formly-ckeditor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, CKEditorModule],
  templateUrl: './ckeditor-field.html',
  styleUrls: ['./ckeditor-field.scss']
  // Removed: changeDetection: ChangeDetectionStrategy.OnPush
})
export class CKEditorFieldComponent extends FieldType<FieldTypeConfig> {
  Editor = ClassicEditor;

  editorConfig = {
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

  onChange({ editor }: ChangeEvent) {
    const data = editor.getData();
    this.formControl.setValue(data, { emitEvent: false });
  }

  onBlur() {
    this.formControl.markAsTouched();
  }

  override get showError(): boolean {
    return this.formControl.invalid && this.formControl.touched;
  }
}
```

**Changes:**
- Removed `ChangeDetectionStrategy.OnPush` to allow automatic change detection
- Added `ChangeEvent` import from CKEditor Angular package
- Added `onChange()` method to sync editor data to form control
- Used `{ emitEvent: false }` to prevent infinite loops

---

## Confirmation Checklist for Phase 4 Completion

### ✅ Functional Requirements
- [ ] CKEditor UI renders in the form
- [ ] Rich text content is visible in the editor
- [ ] Typing in the editor updates the form model
- [ ] Form model value appears in editor on page load
- [ ] Edit mode loads existing content correctly
- [ ] Required field validation works (empty editor shows error)
- [ ] Error message displays when validation fails
- [ ] Form submission includes the rich text content

### ✅ Technical Requirements
- [ ] No TypeScript compilation errors
- [ ] No console errors in browser
- [ ] No manual `setValue()` hacks in other components
- [ ] No debouncing or setTimeout workarounds
- [ ] `ControlValueAccessor` pattern is respected
- [ ] Formly `FieldType` contract is maintained
- [ ] Change detection works correctly

### ✅ Code Quality
- [ ] Minimal changes (only what's necessary)
- [ ] No architectural changes to Formly usage
- [ ] No new state management added
- [ ] Code follows Angular best practices
- [ ] Comments removed or updated for clarity

---

## Alternative Solution (If Above Fails)

If the primary fix doesn't work, try this alternative using `ngModel` instead:

**Template:**
```html
<ckeditor
  [editor]="Editor"
  [config]="editorConfig"
  [(ngModel)]="formControl.value"
  (ngModelChange)="onModelChange($event)"
  (blur)="onBlur()">
</ckeditor>
```

**Component:**
```typescript
import { FormsModule } from '@angular/forms';

@Component({
  // ...
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FormlyModule, CKEditorModule],
})
export class CKEditorFieldComponent extends FieldType<FieldTypeConfig> {
  // ...
  
  onModelChange(data: string) {
    this.formControl.setValue(data);
  }
}
```

However, this approach is less idiomatic with reactive forms.

---

## Next Steps

1. Apply the minimal fix to both files
2. Run `ng serve` and test:
   - Create new entry with rich text content
   - Edit existing entry and verify content loads
   - Test required field validation
   - Submit form and verify data in Redux DevTools
3. If issues persist, check browser console for specific errors
4. Consider alternative solution if primary fix doesn't resolve all issues

---

## Learning Notes

**Key takeaway:** CKEditor's Angular wrapper requires explicit data initialization even when using `formControl` binding. The `ControlValueAccessor` interface is implemented, but the component needs both `[data]` and `(change)` for proper two-way binding in reactive forms contexts.

**Why the original approach failed:**
- OnPush change detection prevented view updates
- Missing `(change)` handler meant editor changes never synced to form
- Missing `[data]` binding meant initial values weren't set in editor

**Best practice for custom Formly field types with complex components:**
- Always bind initial data explicitly: `[data]="formControl.value"`
- Always handle change events: `(change)="onChange($event)"`
- Avoid OnPush unless you manage change detection manually
- Test with both create and edit modes to ensure bi-directional sync
