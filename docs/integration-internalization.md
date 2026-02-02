# Phase 4 Retrospective: CKEditor CVA Implementation Learnings

**Project:** Ubermacht  
**Phase:** 4 - Rich Text Editor Integration  
**Date:** January 29, 2026  
**Stack:** Angular 20, Standalone Components, Ngx-Formly, CKEditor 5  

---

## 1. What Went Wrong (Chronological)

### Initial Symptoms
1. **Editor UI not rendering at all** - Just empty space where CKEditor should be
2. **Form model not receiving content** - Typing into editor (when it worked) didn't update `formModel.content`
3. **Validation behaving incorrectly** - Form marked invalid even with visible content in editor
4. **Cursor jumping issues** - While typing, cursor would randomly jump to start of text

### False Assumptions

**Assumption #1: "formControl binding is enough"**
- **What I thought:** If I bind `[formControl]="formControl"`, Angular's reactive forms will handle everything automatically
- **Reality:** CKEditor's Angular wrapper requires BOTH `[formControl]` AND explicit `[data]` + `(change)` bindings
- **Why this was confusing:** Most Angular form controls work with just `[formControl]`. CKEditor's CVA implementation is "leaky" - it doesn't fully abstract away the underlying editor lifecycle

**Assumption #2: "OnPush is always better for performance"**
- **What I thought:** Using `ChangeDetectionStrategy.OnPush` will make the component faster
- **Reality:** OnPush blocks the reactive form updates from triggering view changes, breaking the editor initialization
- **Why this was confusing:** OnPush works fine with standard form controls, but breaks when a component needs to react to external FormControl value changes during initialization

**Assumption #3: "Namespace imports are equivalent to default imports"**
- **What I thought:** `import * as ClassicEditorBuild` is just a different syntax
- **Reality:** CKEditor's internal Watchdog class references break when using namespace imports, causing "WatchdogClass is not a constructor" errors
- **Why this was confusing:** Most TypeScript libraries handle both import styles, but CKEditor's class structure relies on specific module resolution behavior

**Assumption #4: "If it compiles, the types are compatible"**
- **What I thought:** No TypeScript errors = types are correct
- **Reality:** CKEditor has duplicate type definitions in node_modules causing phantom type conflicts
- **Why this was confusing:** The error mentioned two different paths to the same type, suggesting a dependency resolution issue rather than a usage issue

### Why The Bugs Were Confusing

1. **Symptom overlap:** Performance issues (cursor jumping) and correctness issues (form not updating) manifested similarly
2. **Delayed manifestation:** Some bugs only appeared after specific user interactions (typing, blur, validation)
3. **Abstraction leakage:** Formly + CKEditor + Reactive Forms = 3 layers of abstraction, making it hard to identify which layer was failing
4. **Documentation gaps:** CKEditor docs show standalone usage, Formly docs show simple inputs, neither shows the complete integration pattern
5. **Error messages were misleading:** "WatchdogClass is not a constructor" doesn't hint at import syntax issues

---

## 2. Key Angular Concepts I Learned Deeply

### ControlValueAccessor: What It Really Means

**The textbook definition:**
> A bridge between Angular forms and native form elements or custom components

**What I now understand:**
- CVA is a **protocol**, not magic
- The component implementing CVA **must** call `onChange()` when its internal value changes
- The component implementing CVA **must** implement `writeValue()` to receive external updates
- Just because a component implements CVA doesn't mean you can treat it like `<input>` - some still need explicit event handling

**CKEditor's CVA quirks:**
```typescript
// What I expected to work (like MatInput):
<ckeditor [formControl]="formControl"></ckeditor>

// What actually works (explicit data flow):
<ckeditor 
  [formControl]="formControl"
  [data]="formControl.value || ''"
  (change)="onChange($event)">
</ckeditor>
```

**Why this matters:**
- CKEditor's Angular wrapper implements CVA but doesn't fully hide the editor lifecycle
- The `[data]` binding is needed for proper editor initialization
- The `(change)` event must be manually wired to call `formControl.setValue()`
- This is a **leaky abstraction** - you need to know how CKEditor works internally

### Ownership of Form State

**Core principle:** FormControl is the single source of truth

**What this means in practice:**
1. **Formly creates the FormControl** - it's attached to the form via the `key` property
2. **The custom field component receives the FormControl** - via `this.formControl` from `FieldType`
3. **The component must not fight the FormControl** - don't create internal state that conflicts
4. **Updates flow through FormControl** - not through component state

**The correct mental model:**
```
User types in CKEditor
  ↓
CKEditor emits (change) event
  ↓
Component's onChange() captures editor.getData()
  ↓
Component calls formControl.setValue(data)
  ↓
FormControl updates (single source of truth)
  ↓
Formly model syncs
  ↓
Validation runs
  ↓
Parent form sees changes
```

**The WRONG mental model (what I tried initially):**
```
User types in CKEditor
  ↓
Component state changes
  ↓
Eventually sync to FormControl via debouncing
  ↓
Race conditions, cursor jumping, stale validation
```

### Why Manual setValue Breaks Things

**The trap:**
```typescript
// DON'T DO THIS
onEditorChange(event) {
  const data = event.editor.getData();
  this.formControl.setValue(data); // ← Triggers change event
}
```

**What happens:**
1. User types → editor changes → `onEditorChange` fires → `setValue()` called
2. `setValue()` emits a value change event
3. If any subscribers react to that event (like validation), they can cause re-renders
4. Re-render updates the editor via `[data]` binding
5. Editor re-initializes with new data
6. **Cursor position is lost** → jumps to start

**The fix:**
```typescript
// DO THIS
onChange({ editor }: ChangeEvent) {
  const data = editor.getData();
  this.formControl.setValue(data, { emitEvent: false }); // ← No event loop
}
```

**Why `{ emitEvent: false }` is critical:**
- Prevents the infinite loop: change → setValue → event → change
- The FormControl's value still updates (single source of truth maintained)
- Validators still run (validation is separate from events)
- But subscribers to `valueChanges` don't trigger unnecessary re-renders

### Reactive Forms vs Component Internal State

**Golden rule:** In reactive forms, FormControl IS your state. Period.

**Anti-patterns I learned to avoid:**
```typescript
// ❌ BAD: Duplicate state
export class MyFieldComponent extends FieldType {
  internalValue: string = ''; // ← This is the problem
  
  updateValue(val: string) {
    this.internalValue = val;
    this.formControl.setValue(val); // Now you have two sources of truth
  }
}

// ✅ GOOD: FormControl is the only state
export class MyFieldComponent extends FieldType {
  updateValue(val: string) {
    this.formControl.setValue(val, { emitEvent: false });
  }
  
  // Access value from FormControl, not internal state
  get currentValue() {
    return this.formControl.value;
  }
}
```

**Why this matters:**
- Avoids sync bugs (internal state drifting from FormControl)
- Makes validation deterministic (only one value to validate)
- Prevents cursor jumping (no competing update sources)
- Simplifies debugging (only one place to check the value)

### How Formly Interacts with CVAs

**What Formly does:**
1. Creates a `FormControl` for each field based on the `key` property
2. Adds the `FormControl` to the parent `FormGroup`
3. Injects the `FormControl` into your custom field component via `FieldType`
4. Expects your component to bind to `this.formControl`

**What Formly does NOT do:**
- Handle editor-specific initialization
- Know anything about CKEditor's lifecycle
- Manage the (change) event wiring
- Deal with OnPush change detection issues

**The integration point:**
```typescript
export class CKEditorFieldComponent extends FieldType<FieldTypeConfig> {
  // Formly provides this.formControl via FieldType inheritance
  // You must wire it to CKEditor properly
}
```

**Common mistake:**
```typescript
// ❌ Ignoring the provided FormControl
export class CKEditorFieldComponent extends FieldType {
  myControl = new FormControl(); // Creating a new one - breaks Formly integration
}

// ✅ Using the provided FormControl
export class CKEditorFieldComponent extends FieldType {
  // Use this.formControl (inherited from FieldType)
}
```

---

## 3. CKEditor-Specific Learnings

### What the Angular Wrapper Provides

**The wrapper gives you:**
- `<ckeditor>` component that renders the editor
- `ControlValueAccessor` implementation (partial - see below)
- Input properties: `[editor]`, `[config]`, `[data]`, `[disabled]`
- Output events: `(ready)`, `(change)`, `(blur)`, `(focus)`
- Watchdog integration for crash recovery

**What the wrapper does NOT fully provide:**
- Automatic reactive form integration (despite implementing CVA)
- Cursor position preservation during re-renders
- Protection against event loops
- TypeScript type safety (due to duplicate definitions)

### When NOT to Use (change) or [data]

**Common misconception:** "If using `[formControl]`, don't use `[data]` or `(change)`"

**Reality with CKEditor:**

**You MUST use `[data]` when:**
- You need the editor to initialize with a value
- You're using reactive forms (formControl, formGroup)
- The value can change externally (edit mode, reset, etc.)

**Pattern:**
```html
<ckeditor 
  [data]="formControl.value || ''"
  [formControl]="formControl">
</ckeditor>
```

**You MUST use `(change)` when:**
- Using reactive forms with CKEditor
- You need validation to update immediately
- You need to prevent event loops (`emitEvent: false`)

**Pattern:**
```typescript
onChange({ editor }: ChangeEvent) {
  const data = editor.getData();
  this.formControl.setValue(data, { emitEvent: false });
}
```

**When you DON'T need them:**
- If using `[(ngModel)]` with template-driven forms (different pattern)
- If the editor is read-only
- In rare cases where you're handling everything via the `(ready)` event

### Why Cursor Jumping Happens

**Root cause analysis:**

1. **User types a character**
2. **CKEditor's internal model updates** (cursor at position N)
3. **Your code calls `formControl.setValue(data)`** with `emitEvent: true` (default)
4. **FormControl emits valueChanges**
5. **Angular change detection runs**
6. **Component re-renders** (especially with OnPush disabled)
7. **`[data]` binding updates** with the new value
8. **CKEditor re-initializes content** (cursor resets to position 0)
9. **User sees cursor jump to start**

**The fix:**
```typescript
this.formControl.setValue(data, { emitEvent: false });
```

**Why this works:**
- FormControl value still updates (validation works)
- But no event emission means no re-render trigger
- CKEditor's internal state remains undisturbed
- Cursor position preserved

**Additional considerations:**
- OnPush makes this worse (inconsistent re-renders)
- Debouncing setValue makes this worse (delayed jumps)
- Direct DOM manipulation would break Angular completely

### Why Debouncing Form Writes is Dangerous

**What I initially tried:**
```typescript
private editorChange$ = new Subject<string>();

constructor() {
  this.editorChange$
    .pipe(debounceTime(300))
    .subscribe(data => {
      this.formControl.setValue(data);
    });
}

onEditorChange(event: ChangeEvent) {
  this.editorChange$.next(event.editor.getData());
}
```

**Why this SEEMS smart:**
- Reduces number of setValue calls
- Better performance (less validation runs)
- Common pattern in search inputs

**Why this FAILS with CKEditor:**
1. **Validation is delayed** - form appears invalid for 300ms after typing stops
2. **Cursor jumping still happens** - just 300ms later instead of immediately
3. **User experience is worse** - validation errors flash in/out
4. **Race conditions** - blur might happen before debounce fires
5. **Loss of data** - if user types and immediately navigates away

**The correct approach:**
```typescript
onChange({ editor }: ChangeEvent) {
  // Update immediately, no debouncing
  const data = editor.getData();
  this.formControl.setValue(data, { emitEvent: false });
}
```

**When debouncing IS appropriate:**
- Search inputs that trigger API calls
- Auto-save features (separate from form state)
- Analytics or telemetry events

**When debouncing IS NOT appropriate:**
- Core form validation
- Required field checks
- Data that affects submit button state
- Anything related to FormControl state

---

## 4. Formly-Specific Learnings

### FieldType Responsibilities

**What you MUST do when extending FieldType:**
1. **Use `this.formControl`** - never create your own FormControl
2. **Bind to `this.formControl`** - in your template
3. **Use `this.props`** - for field configuration (label, required, etc.)
4. **Implement validation display** - via `this.showError` or similar
5. **Mark touched on blur** - `this.formControl.markAsTouched()`

**What you MUST NOT do:**
1. **Create internal state that duplicates formControl.value**
2. **Ignore the provided formControl**
3. **Manually manage validation** (Formly does this)
4. **Try to access parent form directly** (use formControl instead)

**The template contract:**
```html
<!-- ✅ CORRECT -->
<ckeditor 
  [formControl]="formControl"
  [data]="formControl.value || ''"
  (change)="onChange($event)"
  (blur)="onBlur()">
</ckeditor>

<div *ngIf="showError">
  {{ errorMessage }}
</div>

<!-- ❌ WRONG -->
<ckeditor 
  [(ngModel)]="internalValue"
  (ngModelChange)="syncToFormControl($event)">
</ckeditor>
```

### How Formly Wires FormControl

**The lifecycle:**

1. **Formly creates FormGroup** in parent component
   ```typescript
   form = new FormGroup({});
   ```

2. **Formly reads field config**
   ```typescript
   fields: FormlyFieldConfig[] = [
     { key: 'content', type: 'ckeditor', props: { required: true } }
   ];
   ```

3. **Formly creates FormControl** with key 'content'
   ```typescript
   // Internally, Formly does:
   form.addControl('content', new FormControl('', Validators.required));
   ```

4. **Formly instantiates your component**
   ```typescript
   // Your component gets:
   this.field = { key: 'content', type: 'ckeditor', ... }
   this.formControl = form.get('content') as FormControl;
   this.props = { required: true, ... }
   ```

5. **Your component binds to formControl**
   ```html
   <ckeditor [formControl]="formControl">
   ```

**What this means:**
- The FormControl is **already created** before your component exists
- The FormControl is **already added** to the parent FormGroup
- The FormControl **already has validators** applied (if configured)
- You are just **binding to an existing FormControl**, not creating one

### What Formly Expects from Custom Fields

**The contract:**

1. **Bind to `this.formControl`** in your template
2. **Update `this.formControl.value`** when your control changes
3. **Display validation errors** when `this.showError` is true
4. **Mark as touched** when appropriate (usually on blur)
5. **Don't break the value flow** (single source of truth)

**Example implementation:**
```typescript
@Component({
  selector: 'app-formly-ckeditor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, CKEditorModule],
  template: `
    <div class="field-wrapper">
      <label *ngIf="props.label">
        {{ props.label }}
        <span *ngIf="props.required">*</span>
      </label>
      
      <ckeditor
        [editor]="Editor"
        [config]="editorConfig"
        [formControl]="formControl"
        [data]="formControl.value || ''"
        (change)="onChange($event)"
        (blur)="onBlur()">
      </ckeditor>
      
      <div class="error" *ngIf="showError">
        <ng-container *ngFor="let error of formControl.errors | keyvalue">
          {{ getErrorMessage(error.key) }}
        </ng-container>
      </div>
    </div>
  `
})
export class CKEditorFieldComponent extends FieldType<FieldTypeConfig> {
  Editor: any = ClassicEditor;
  
  editorConfig = { /* ... */ };
  
  onChange({ editor }: ChangeEvent) {
    this.formControl.setValue(editor.getData(), { emitEvent: false });
  }
  
  onBlur() {
    this.formControl.markAsTouched();
  }
  
  override get showError(): boolean {
    return this.formControl.invalid && this.formControl.touched;
  }
}
```

### How Validation Truly Flows

**The validation chain:**

```
User types in editor
  ↓
onChange() fires
  ↓
formControl.setValue(data, { emitEvent: false })
  ↓
FormControl value updates
  ↓
Validators run automatically (Angular's mechanism)
  ↓
formControl.status changes (VALID/INVALID)
  ↓
this.showError computed property re-evaluates
  ↓
Error message shows/hides
```

**Key insight:** Validators run on `setValue()` even with `{ emitEvent: false }`

**What `{ emitEvent: false }` prevents:**
- `valueChanges` observable from emitting
- Parent form `valueChanges` from emitting
- Subscriptions to `valueChanges` from triggering
- Unnecessary re-renders

**What `{ emitEvent: false }` does NOT prevent:**
- Validation from running
- `status` from updating (VALID/INVALID)
- `errors` object from updating
- Touch state from being checked

**Common mistake:**
```typescript
// ❌ Thinking emitEvent: false skips validation
this.formControl.setValue(data, { emitEvent: false });
// Validation still runs! Status still updates!

// If you ACTUALLY wanted to skip validation (rare):
this.formControl.setValue(data, { 
  emitEvent: false,
  emitModelToViewChange: false,
  emitViewToModelChange: false 
});
// But this breaks Angular forms contract - don't do this
```

**The right mental model:**
- `emitEvent: false` = "don't broadcast this change to observers"
- Validation = "always verify the value meets constraints"
- These are orthogonal concerns

---

## 5. Performance & Debugging Lessons

### Why UI Freezes Happened

**Initial symptoms:**
- App would freeze for 100-200ms when typing
- Cursor would jump during typing
- Interaction to Next Paint (INP) was > 500ms

**Root causes identified:**

1. **OnPush + Reactive Forms = Bad Interaction**
   - OnPush blocks change detection for form value updates
   - But when change detection DOES run, it's heavy (re-initializes editor)
   - Result: periodic freezes rather than smooth updates

2. **Event loops without emitEvent: false**
   - Every keystroke triggered full change detection cycle
   - `valueChanges` observers fired on every character
   - Re-renders caused CKEditor re-initialization

3. **Debouncing created perceived freezes**
   - Validation delayed by 300ms
   - Error states flickering in/out
   - User sees "frozen" validation

**The fix hierarchy:**
1. Remove OnPush (allow normal change detection)
2. Add `emitEvent: false` (reduce unnecessary events)
3. Remove debouncing (immediate validation)
4. Proper data binding (prevent re-initialization)

### Why INP Improvements Masked Correctness Bugs

**The trap:**

After fixing OnPush and event loops, the app FELT faster:
- No more freezes
- Cursor stopped jumping
- Typing was smooth

BUT the form was still broken:
- Model wasn't updating properly
- Validation was inconsistent
- Submit would fail

**Lesson learned: Performance ≠ Correctness**

**The confusion:**
- **Performance issues** (freezes, janky UI) were VISIBLE and annoying
- **Correctness issues** (wrong validation state) were SUBTLE and easy to miss
- Fixing performance made the app "feel" working, even when it wasn't

**How to avoid this:**
1. **Test the data flow explicitly** - log formModel values, check Redux state
2. **Test edge cases** - empty field, required validation, form submission
3. **Don't trust the UI** - just because it looks right doesn't mean the data is right
4. **Separate concerns** - fix correctness first, then optimize performance

**Testing checklist I now use:**
- [ ] Type in editor → check `formModel.content` updates
- [ ] Clear editor → check required validation triggers
- [ ] Submit form → check data reaches state/API
- [ ] Edit existing entry → check editor loads with data
- [ ] Rapid typing → check no data loss
- [ ] Blur without changes → check no false validation

### How to Distinguish Performance Issues from Correctness Issues

**Performance issues manifest as:**
- Visible UI freezes/jank
- Slow interaction response
- High INP/FID metrics
- Browser DevTools shows long tasks
- But the DATA might be correct (just slow)

**Correctness issues manifest as:**
- Wrong values in form model
- Validation not triggering when it should
- Data not persisting
- Inconsistent state between UI and model
- Console errors (often)

**Diagnostic approach:**

**For Performance:**
1. Open Chrome DevTools Performance tab
2. Record interaction
3. Look for long tasks (> 50ms)
4. Identify what's causing the task
5. Optimize that specific code path

**For Correctness:**
1. Add `console.log()` at every state transition
2. Check Angular DevTools for form state
3. Use Redux DevTools to verify state
4. Inspect network payload on submit
5. Test edge cases deliberately

**Example debugging session:**
```typescript
// Add logging to every step
onChange({ editor }: ChangeEvent) {
  const data = editor.getData();
  console.log('1. Editor data:', data);
  
  this.formControl.setValue(data, { emitEvent: false });
  console.log('2. FormControl value:', this.formControl.value);
  console.log('3. FormControl valid:', this.formControl.valid);
  console.log('4. FormControl errors:', this.formControl.errors);
}

// In parent component
onSubmit() {
  console.log('5. Form model:', this.formModel);
  console.log('6. Form valid:', this.form.valid);
  console.log('7. Form values:', this.form.value);
}
```

### Red Flags to Watch For in the Future

**Code smells that indicate problems:**

1. **Multiple sources of truth**
   ```typescript
   // 🚩 RED FLAG
   export class MyComponent {
     internalValue = '';
     formControl = new FormControl();
     // Which one is right?
   }
   ```

2. **Manual debouncing of form updates**
   ```typescript
   // 🚩 RED FLAG
   editorChange$.pipe(debounceTime(300)).subscribe(...)
   ```

3. **Calling setValue without emitEvent: false in a change handler**
   ```typescript
   // 🚩 RED FLAG
   onChange(event) {
     this.formControl.setValue(event.data); // Event loop!
   }
   ```

4. **OnPush with reactive forms that depend on external value changes**
   ```typescript
   // 🚩 RED FLAG
   @Component({
     changeDetection: ChangeDetectionStrategy.OnPush
   })
   export class MyFieldComponent extends FieldType {
     // Form updates won't trigger change detection
   }
   ```

5. **Creating FormControl in a FieldType**
   ```typescript
   // 🚩 RED FLAG
   export class MyFieldComponent extends FieldType {
     myControl = new FormControl(); // Ignoring this.formControl!
   }
   ```

6. **Namespace imports for CKEditor**
   ```typescript
   // 🚩 RED FLAG
   import * as ClassicEditorBuild from '@ckeditor/ckeditor5-build-classic';
   ```

7. **Not marking as touched on blur**
   ```typescript
   // 🚩 RED FLAG - validation won't show until form submission
   onBlur() {
     // Nothing here
   }
   ```

8. **Trying to "fix" TypeScript errors with complex type gymnastics**
   ```typescript
   // 🚩 RED FLAG - just use `any` for CKEditor
   Editor: AwfullyComplexGenericType<...>
   ```

9. **Performance optimizations before correctness verification**
   ```typescript
   // 🚩 RED FLAG - make it work first, then make it fast
   // Added debouncing, OnPush, memoization, etc. before testing data flow
   ```

10. **Comments that say "hack" or "workaround"**
    ```typescript
    // 🚩 RED FLAG - if you know it's a hack, it probably needs fixing
    // HACK: Manually call detectChanges because...
    ```

**Green flags (correct patterns):**

✅ Single source of truth (FormControl)  
✅ Immediate validation (no debouncing)  
✅ `{ emitEvent: false }` in change handlers  
✅ Default imports for CKEditor  
✅ `any` type for Editor property  
✅ Normal change detection (not OnPush)  
✅ Explicit `[data]` and `(change)` bindings  
✅ Marking touched on blur  

---

## 6. Correct Final Mental Model (The "Golden Path")

### Who Owns Typing

**Answer: CKEditor owns the typing experience**

**What this means:**
- CKEditor handles DOM events (keydown, keyup, etc.)
- CKEditor manages cursor position
- CKEditor handles text transformation (bold, italic, etc.)
- CKEditor maintains its internal document model

**What you must NOT do:**
- Don't intercept keydown events
- Don't manipulate CKEditor's DOM directly
- Don't call editor methods that affect cursor position
- Don't trigger re-renders during typing

**The contract:**
```
User → CKEditor (typing) → CKEditor internal model → (change) event → Your code
```

### Who Owns Validation

**Answer: Angular FormControl owns validation**

**What this means:**
- Validators are registered on the FormControl (via Formly config)
- Validators run automatically when value changes
- Validation state lives in `formControl.errors`
- Your component just DISPLAYS the validation state

**What you must NOT do:**
- Don't create custom validation logic in the component
- Don't skip validation by avoiding setValue
- Don't manually set `formControl.errors`
- Don't debounce validation checks

**The contract:**
```
formControl.setValue() → Validators run → formControl.status updates → showError computed → UI updates
```

**Implementation:**
```typescript
// ✅ Correct: Trust Angular's validation
override get showError(): boolean {
  return this.formControl.invalid && this.formControl.touched;
}

// ❌ Wrong: Custom validation logic
override get showError(): boolean {
  return this.myInternalValidationLogic();
}
```

### Who Owns Persistence

**Answer: Parent form/component owns persistence**

**What this means:**
- Your field component just updates `formControl.value`
- The parent component handles form submission
- The parent component dispatches actions to state/API
- Your field component doesn't know about persistence

**What you must NOT do:**
- Don't dispatch actions from field component
- Don't make API calls from field component
- Don't interact with state management directly
- Don't implement auto-save in field component

**The contract:**
```
Field updates FormControl → Parent form aggregates values → Parent handles submission → State/API
```

**Separation of concerns:**
```typescript
// Field component: ONLY updates FormControl
export class CKEditorFieldComponent extends FieldType {
  onChange({ editor }: ChangeEvent) {
    this.formControl.setValue(editor.getData(), { emitEvent: false });
  }
}

// Parent component: Handles persistence
export class EntryFormComponent {
  onSubmit() {
    if (this.form.valid) {
      this.store.dispatch(new AddEntry(this.formModel));
    }
  }
}
```

### The Single-Source-of-Truth Principle

**The fundamental rule:**
> In reactive forms, FormControl.value is the ONLY source of truth

**Implications:**

1. **No internal component state for the value**
   ```typescript
   // ❌ Two sources of truth
   export class MyComponent {
     internalValue = '';
     formControl: FormControl;
   }
   
   // ✅ One source of truth
   export class MyComponent {
     formControl: FormControl;
     // Access via this.formControl.value
   }
   ```

2. **Display value comes from FormControl**
   ```html
   <!-- ❌ Wrong -->
   <div>{{ internalValue }}</div>
   
   <!-- ✅ Correct -->
   <div>{{ formControl.value }}</div>
   ```

3. **Validation checks FormControl**
   ```typescript
   // ❌ Wrong
   get isValid() { return this.internalValue !== ''; }
   
   // ✅ Correct
   get isValid() { return this.formControl.valid; }
   ```

4. **External updates go to FormControl**
   ```typescript
   // When loading data in edit mode
   ngOnInit() {
     // ❌ Wrong
     this.internalValue = this.model.content;
     
     // ✅ Correct
     // Formly handles this via field config `defaultValue` or parent form's `patchValue()`
   }
   ```

5. **Editor initialization reads from FormControl**
   ```html
   <!-- ✅ Correct -->
   <ckeditor [data]="formControl.value || ''">
   ```

**The data flow diagram:**
```
                    FormControl (SINGLE SOURCE OF TRUTH)
                           ↓           ↑
                           ↓           ↑
                   [data] binding   setValue()
                           ↓           ↑
                           ↓           ↑
                      CKEditor Component
                           ↓           ↑
                           ↓           ↑
                    Display     (change) event
```

**Never:**
```
  FormControl ←→ Component State ←→ CKEditor
      ↕               ↕
  Validation      Display
```

---

## 7. Rules I Should Remember (Hard Rules)

### The Ten Commandments of Formly + CKEditor

1. **Thou shalt not create internal state for form values**
   - FormControl is the single source of truth
   - No `internalValue`, `currentText`, or similar properties
   - Always read from `this.formControl.value`

2. **Thou shalt use `{ emitEvent: false }` in change handlers**
   - Every `formControl.setValue()` in a change/input handler must have it
   - Prevents event loops
   - Prevents cursor jumping
   - Validation still runs

3. **Thou shalt bind `[data]` to `formControl.value`**
   - Even when using `[formControl]` binding
   - Pattern: `[data]="formControl.value || ''"`
   - Ensures editor initializes with form value
   - Critical for edit mode

4. **Thou shalt not use OnPush change detection with reactive form fields**
   - Unless you manually trigger change detection at the right times
   - Default change detection is fine for form fields
   - Performance gains aren't worth the complexity

5. **Thou shalt not debounce FormControl.setValue() calls**
   - Breaks validation timing
   - Causes cursor jumping
   - Creates race conditions
   - Debounce API calls, not form state

6. **Thou shalt mark as touched on blur**
   - `this.formControl.markAsTouched()` in `onBlur()`
   - Enables "touched" validation display pattern
   - Users expect validation after leaving a field

7. **Thou shalt use default imports for CKEditor ClassicEditor**
   - `import ClassicEditor from '@ckeditor/ckeditor5-build-classic'`
   - NOT `import * as ClassicEditor`
   - Prevents Watchdog constructor errors

8. **Thou shalt type Editor as `any` to bypass CKEditor type conflicts**
   - `Editor: any = ClassicEditor;`
   - Don't fight the duplicate type definitions
   - TypeScript can't resolve CKEditor's complex types

9. **Thou shalt trust Angular's validation mechanism**
   - Don't create custom validation logic in field components
   - Validators run automatically on `setValue()`
   - Use `formControl.invalid` and `formControl.errors`

10. **Thou shalt verify correctness before optimizing performance**
    - Make it work, then make it fast
    - Log form values at each step
    - Test edge cases before claiming "done"
    - Performance improvements can mask correctness bugs

### Additional Rules (11-15)

11. **Thou shalt not create FormControl in FieldType components**
    - Use `this.formControl` provided by FieldType
    - Formly creates and manages it
    - Creating your own breaks Formly integration

12. **Thou shalt handle the `(change)` event explicitly**
    - Don't rely solely on `[formControl]` binding
    - Pattern: `(change)="onChange($event)"`
    - Call `formControl.setValue()` with editor data

13. **Thou shalt not manipulate CKEditor's DOM directly**
    - Let CKEditor manage its own DOM
    - Don't use `@ViewChild` to access editor internals
    - Don't use `document.querySelector` on editor content

14. **Thou shalt separate performance issues from correctness issues**
    - UI jank ≠ wrong data
    - Test data flow explicitly with console.log
    - Check form.value, not just visual appearance

15. **Thou shalt read official documentation with skepticism**
    - CKEditor docs show standalone usage
    - Formly docs show simple inputs
    - Neither shows the complete integration
    - You must synthesize the patterns yourself

---

## 8. How I Would Explain This to Another Angular Developer

### Short Explanation (Elevator Pitch)

"CKEditor's Angular wrapper is a leaky abstraction. Even though it implements `ControlValueAccessor`, you still need to explicitly bind `[data]` and handle the `(change)` event. The key is to call `formControl.setValue(data, { emitEvent: false })` to prevent event loops that cause cursor jumping. Also, use default imports for ClassicEditor, type the Editor as `any`, and avoid OnPush change detection. Most importantly: FormControl is your single source of truth—never create internal state that duplicates its value."

**TL;DR:** `[data]` + `(change)` + `emitEvent: false` + default import + `any` type = working CKEditor in Formly.

---

### Long Explanation (Teaching Session)

**Context Setting:**

"We're building a form with Ngx-Formly and want to add a rich text editor using CKEditor 5. On paper, this should be straightforward:

1. CKEditor has an Angular wrapper
2. The wrapper implements `ControlValueAccessor`
3. Formly works with any Angular form control
4. Therefore, it should 'just work'

But it doesn't. Here's why and how to fix it."

**The Problem:**

"CKEditor's Angular wrapper implements `ControlValueAccessor`, which theoretically means it should work like any other form control. But in practice, the wrapper doesn't fully abstract away CKEditor's lifecycle. You can't just slap `[formControl]="formControl"` on it and call it a day.

The symptoms you'll see:
- Editor doesn't render at all
- Editor renders but form doesn't update
- Cursor jumps to the start while typing
- Validation is inconsistent"

**The Root Causes:**

"There are actually multiple issues stacking on top of each other:

**Issue 1: CKEditor needs explicit data initialization**

Even with `[formControl]` binding, the editor won't initialize with the form's value unless you also bind `[data]`. This is different from MatInput or other Angular components.

```html
<!-- Won't work -->
<ckeditor [formControl]="formControl"></ckeditor>

<!-- Will work -->
<ckeditor 
  [formControl]="formControl"
  [data]="formControl.value || ''">
</ckeditor>
```

**Issue 2: Change events need manual wiring**

When the user types, CKEditor emits a `(change)` event. But this doesn't automatically update the FormControl. You have to handle it:

```typescript
onChange({ editor }: ChangeEvent) {
  const data = editor.getData();
  this.formControl.setValue(data);
}
```

**Issue 3: Event loops cause cursor jumping**

If you call `setValue()` without `{ emitEvent: false }`, you create an event loop:
1. User types → change event → setValue()
2. setValue() → valueChanges emits → change detection
3. Change detection → `[data]` updates → editor re-initializes
4. Editor re-initializes → cursor resets to position 0

The fix:
```typescript
this.formControl.setValue(data, { emitEvent: false });
```

**Issue 4: Import syntax matters**

CKEditor's internal Watchdog class breaks with namespace imports:

```typescript
// Breaks with 'WatchdogClass is not a constructor'
import * as ClassicEditorBuild from '@ckeditor/ckeditor5-build-classic';

// Works correctly
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
```

**Issue 5: TypeScript type conflicts**

CKEditor has duplicate type definitions in node_modules. TypeScript gets confused about which one to use. The solution is to just type it as `any`:

```typescript
Editor: any = ClassicEditor;
```

**Issue 6: OnPush breaks reactive forms**

If you use `ChangeDetectionStrategy.OnPush`, form value updates won't trigger change detection. The editor won't initialize with values, and validation won't update properly. Just use default change detection."

**The Solution (The Complete Pattern):**

"Here's the complete working implementation:

```typescript
// ckeditor-field.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { CKEditorModule, ChangeEvent } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'; // Default import

@Component({
  selector: 'app-formly-ckeditor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, CKEditorModule],
  templateUrl: './ckeditor-field.html',
  styleUrls: ['./ckeditor-field.scss']
  // No OnPush!
})
export class CKEditorFieldComponent extends FieldType<FieldTypeConfig> {
  Editor: any = ClassicEditor; // Type as any
  
  editorConfig = {
    toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList']
  };
  
  onChange({ editor }: ChangeEvent) {
    const data = editor.getData();
    this.formControl.setValue(data, { emitEvent: false }); // Critical!
  }
  
  onBlur() {
    this.formControl.markAsTouched(); // For validation display
  }
  
  override get showError(): boolean {
    return this.formControl.invalid && this.formControl.touched;
  }
}
```

```html
<!-- ckeditor-field.html -->
<div class="ckeditor-field">
  <label *ngIf="props.label">
    {{ props.label }}
    <span *ngIf="props.required">*</span>
  </label>
  
  <ckeditor
    [editor]="Editor"
    [config]="editorConfig"
    [formControl]="formControl"
    [data]="formControl.value || ''"
    (change)="onChange($event)"
    (blur)="onBlur()">
  </ckeditor>
  
  <div class="error" *ngIf="showError">
    <ng-container *ngFor="let error of formControl.errors | keyvalue">
      {{ error.key === 'required' ? 'This field is required' : error.value }}
    </ng-container>
  </div>
</div>
```

```typescript
// app.config.ts - Registration
FormlyModule.forRoot({
  types: [
    { name: 'ckeditor', component: CKEditorFieldComponent }
  ],
  validationMessages: [
    { name: 'required', message: 'This field is required' }
  ]
}).providers || []
```

```typescript
// Usage in form
fields: FormlyFieldConfig[] = [
  {
    key: 'content',
    type: 'ckeditor',
    props: {
      label: 'Content',
      required: true
    }
  }
];
```

**The Mental Model:**

"Think of it this way: CKEditor is like a mini-application inside your form. It has its own lifecycle, its own state management, its own rendering pipeline. The Angular wrapper is just a thin bridge that:

1. Renders the CKEditor instance
2. Provides some inputs/outputs for configuration
3. Implements CVA, but incompletely

Your job is to be the integration layer between CKEditor's world and Angular's world. You're translating events from one system to the other:

- CKEditor changes → Angular FormControl (via `onChange`)
- Angular FormControl → CKEditor display (via `[data]`)
- Both → synchronized, single source of truth

The key insight is: **FormControl.value is the boss**. CKEditor displays it, the user edits it, and you sync it back to FormControl. Never create a second copy of the value in component state. That's how you get out of sync and create bugs."

**Common Mistakes to Avoid:**

"I made all of these mistakes, so learn from my pain:

1. **Trying to 'optimize' with debouncing** - Breaks validation timing
2. **Using OnPush for performance** - Breaks reactive forms integration
3. **Creating internal state** - Creates two sources of truth
4. **Not testing edge cases** - Empty field, required validation, edit mode
5. **Assuming performance improvements mean correctness** - UI can be fast but data can be wrong
6. **Fighting TypeScript** - Just use `any` for the Editor type
7. **Using namespace imports** - Breaks CKEditor's internal classes
8. **Trusting documentation** - Neither CKEditor nor Formly docs show this exact integration"

**Testing Checklist:**

"Before you call it done, test these scenarios:

1. Type in editor → check `console.log(form.value)` updates
2. Clear editor → check required validation error appears
3. Submit form → check data reaches state/API
4. Load existing data (edit mode) → check editor shows the content
5. Type rapidly → check cursor doesn't jump
6. Blur field → check validation error appears (if invalid)
7. Reload page with stored data → check persistence works
8. Test with empty initial value → check placeholder works
9. Test with long content → check performance is acceptable
10. Test tab key → check focus management works"

**Final Advice:**

"The pattern is weird, yes. It feels like you're doing too much manual wiring for a library that claims to 'just work' with Angular forms. But that's the reality of integrating complex third-party components. 

The good news: once you have this pattern, it's copy-paste-able. Every CKEditor integration will look exactly like this. The bad news: you have to understand WHY it works this way, or you'll break it when you try to 'improve' it.

Remember: FormControl is king. Everything else is just ceremony to keep CKEditor and FormControl in sync. Don't fight this model—embrace it."

---

## Summary

**Phase 4 taught me:**
- **ControlValueAccessor is a protocol, not magic** - implementations vary in quality
- **Single source of truth is non-negotiable** - FormControl.value must be the authority
- **Performance and correctness are separate concerns** - fast doesn't mean correct
- **Documentation gaps are real** - integration patterns often aren't documented
- **Simple solutions are often correct** - remove OnPush, remove debouncing, trust Angular
- **TypeScript types can lie** - duplicate definitions cause phantom errors
- **Import syntax matters** - default vs namespace can break runtime behavior
- **Testing must be explicit** - log the data flow, don't trust the UI
- **Abstraction leakage is common** - especially with complex third-party libraries
- **The hard way is the learning way** - making mistakes and fixing them builds deep understanding

**The golden rule:**
> In reactive forms with Formly, FormControl is the single source of truth. Your custom field component is just a view layer that displays FormControl's value and syncs user changes back to it. Never create internal state, never debounce FormControl updates, and never fight the framework.

---

*End of Phase 4 Retrospective*
