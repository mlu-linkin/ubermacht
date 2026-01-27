# Angular Material Components for Dashboard Layouts

This guide covers the most commonly used Angular Material components for building professional dashboard layouts in Angular 20.

## Essential Structural Components

### 1. MatToolbar - Top Navigation Bar

The toolbar component provides a container for headers, titles, and navigation elements.

```typescript
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  standalone: true,
  imports: [MatToolbarModule],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button>
        <mat-icon>menu</mat-icon>
      </button>
      <span>My Dashboard</span>
      <span class="spacer"></span>
      <button mat-icon-button>
        <mat-icon>notifications</mat-icon>
      </button>
      <button mat-icon-button>
        <mat-icon>account_circle</mat-icon>
      </button>
    </mat-toolbar>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
  `]
})
```

**Common Use Cases:**
- App header with logo and title
- Navigation bar with action buttons
- Breadcrumb navigation

### 2. MatSidenav - Side Navigation Panel

Provides a sliding drawer for navigation menus, perfect for responsive layouts.

```typescript
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [MatSidenavModule, MatListModule, MatIconModule],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #sidenav mode="side" opened class="sidenav">
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/analytics">
            <mat-icon>analytics</mat-icon>
            <span>Analytics</span>
          </a>
          <a mat-list-item routerLink="/reports">
            <mat-icon>assessment</mat-icon>
            <span>Reports</span>
          </a>
          <a mat-list-item routerLink="/settings">
            <mat-icon>settings</mat-icon>
            <span>Settings</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      
      <mat-sidenav-content>
        <router-outlet></router-outlet>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100%;
    }
    .sidenav {
      width: 250px;
    }
  `]
})
```

**Sidenav Modes:**
- `side` - Pushes content (desktop view)
- `over` - Overlays content (mobile view)
- `push` - Pushes content but overlays when closed

### 3. MatCard - Content Containers

Cards provide elevated containers for displaying content and widgets.

```typescript
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-icon mat-card-avatar>show_chart</mat-icon>
        <mat-card-title>Revenue</mat-card-title>
        <mat-card-subtitle>Last 30 days</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <h2>$45,231.89</h2>
        <p>+20.1% from last month</p>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-button>VIEW DETAILS</button>
        <button mat-button>EXPORT</button>
      </mat-card-actions>
    </mat-card>
  `
})
```

**Use Cases:**
- KPI widgets
- Statistics displays
- Data summaries
- Action panels

## Data Display Components

### 4. MatTable - Data Tables

Displays structured data in rows and columns with sorting, pagination, and filtering.

```typescript
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  standalone: true,
  imports: [MatTableModule, MatSortModule, MatPaginatorModule],
  template: `
    <div class="table-container">
      <table mat-table [dataSource]="dataSource" matSort>
        
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
          <td mat-cell *matCellDef="let row">{{row.id}}</td>
        </ng-container>
        
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
          <td mat-cell *matCellDef="let row">{{row.name}}</td>
        </ng-container>
        
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">
            <mat-chip [color]="row.status === 'Active' ? 'primary' : 'warn'">
              {{row.status}}
            </mat-chip>
          </td>
        </ng-container>
        
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button>
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      
      <mat-paginator 
        [pageSizeOptions]="[5, 10, 25, 100]"
        showFirstLastButtons>
      </mat-paginator>
    </div>
  `
})
export class DataTableComponent {
  displayedColumns = ['id', 'name', 'status', 'actions'];
  dataSource = new MatTableDataSource(DATA);
}
```

### 5. MatPaginator - Pagination Controls

Provides navigation for paged data.

```typescript
import { MatPaginatorModule } from '@angular/material/paginator';

// Template
<mat-paginator 
  [length]="100"
  [pageSize]="10"
  [pageSizeOptions]="[5, 10, 25, 100]"
  showFirstLastButtons
  (page)="onPageChange($event)">
</mat-paginator>
```

### 6. MatChip - Tags and Labels

Display small pieces of information, tags, or status indicators.

```typescript
import { MatChipsModule } from '@angular/material/chips';

@Component({
  standalone: true,
  imports: [MatChipsModule],
  template: `
    <mat-chip-set>
      <mat-chip color="primary" selected>Active</mat-chip>
      <mat-chip color="accent">Pending</mat-chip>
      <mat-chip color="warn">Urgent</mat-chip>
      <mat-chip disabled>Archived</mat-chip>
    </mat-chip-set>
  `
})
```

## Interactive Components

### 7. MatMenu - Dropdown Menus

Provides dropdown menus for actions and options.

```typescript
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [MatMenuModule, MatButtonModule, MatIconModule],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="menu">
      <mat-icon>more_vert</mat-icon>
    </button>
    
    <mat-menu #menu="matMenu">
      <button mat-menu-item>
        <mat-icon>edit</mat-icon>
        <span>Edit</span>
      </button>
      <button mat-menu-item>
        <mat-icon>delete</mat-icon>
        <span>Delete</span>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item>
        <mat-icon>archive</mat-icon>
        <span>Archive</span>
      </button>
    </mat-menu>
  `
})
```

### 8. MatTabs - Tabbed Navigation

Organize content into switchable tabs.

```typescript
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  standalone: true,
  imports: [MatTabsModule],
  template: `
    <mat-tab-group>
      <mat-tab label="Overview">
        <div class="tab-content">
          <h2>Overview Content</h2>
        </div>
      </mat-tab>
      
      <mat-tab label="Analytics">
        <div class="tab-content">
          <h2>Analytics Content</h2>
        </div>
      </mat-tab>
      
      <mat-tab label="Reports">
        <div class="tab-content">
          <h2>Reports Content</h2>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .tab-content {
      padding: 16px;
    }
  `]
})
```

### 9. MatButton - Action Buttons

Various button styles for different actions.

```typescript
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <!-- Basic buttons -->
    <button mat-button>Basic</button>
    <button mat-raised-button color="primary">Primary</button>
    <button mat-raised-button color="accent">Accent</button>
    <button mat-raised-button color="warn">Warn</button>
    
    <!-- Flat buttons -->
    <button mat-flat-button color="primary">Flat Primary</button>
    
    <!-- Stroked buttons -->
    <button mat-stroked-button>Stroked</button>
    
    <!-- Icon buttons -->
    <button mat-icon-button>
      <mat-icon>favorite</mat-icon>
    </button>
    
    <!-- FAB (Floating Action Button) -->
    <button mat-fab color="primary">
      <mat-icon>add</mat-icon>
    </button>
    
    <!-- Mini FAB -->
    <button mat-mini-fab color="accent">
      <mat-icon>edit</mat-icon>
    </button>
  `
})
```

## Form Components for Dashboards

### 10. MatFormField - Form Input Container

Wrapper for form controls with labels and hints.

```typescript
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
  template: `
    <form>
      <mat-form-field appearance="outline">
        <mat-label>Search</mat-label>
        <input matInput placeholder="Search items...">
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>
      
      <mat-form-field appearance="fill">
        <mat-label>Category</mat-label>
        <mat-select>
          <mat-option value="all">All</mat-option>
          <mat-option value="active">Active</mat-option>
          <mat-option value="pending">Pending</mat-option>
        </mat-select>
      </mat-form-field>
      
      <mat-form-field appearance="outline">
        <mat-label>Date Range</mat-label>
        <input matInput [matDatepicker]="picker">
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
    </form>
  `
})
```

**Appearances:**
- `fill` - Filled background
- `outline` - Outlined border
- `standard` - Underline only (legacy)

### 11. MatDatepicker - Date Selection

Calendar picker for date inputs.

```typescript
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// Don't forget to provide date adapter in app.config.ts:
// provideNativeDateAdapter()

@Component({
  standalone: true,
  imports: [MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field>
      <mat-label>Choose a date</mat-label>
      <input matInput [matDatepicker]="picker">
      <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
    </mat-form-field>
  `
})
```

## Feedback Components

### 12. MatProgressBar - Loading Indicators

Shows progress or loading state.

```typescript
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  standalone: true,
  imports: [MatProgressBarModule],
  template: `
    <!-- Determinate - shows actual progress -->
    <mat-progress-bar mode="determinate" [value]="progress"></mat-progress-bar>
    
    <!-- Indeterminate - continuous animation -->
    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    
    <!-- Buffer - shows buffering state -->
    <mat-progress-bar mode="buffer" [value]="value" [bufferValue]="bufferValue"></mat-progress-bar>
  `
})
```

### 13. MatProgressSpinner - Circular Progress

Circular loading indicator.

```typescript
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <mat-spinner></mat-spinner>
    <mat-spinner [diameter]="50"></mat-spinner>
    <mat-progress-spinner mode="determinate" [value]="progress"></mat-progress-spinner>
  `
})
```

### 14. MatBadge - Notification Badges

Display notification counts or status indicators.

```typescript
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  standalone: true,
  imports: [MatBadgeModule, MatIconModule],
  template: `
    <button mat-icon-button matBadge="15" matBadgeColor="warn">
      <mat-icon>notifications</mat-icon>
    </button>
    
    <button mat-icon-button matBadge="5" matBadgeColor="accent">
      <mat-icon>mail</mat-icon>
    </button>
    
    <span matBadge="NEW" matBadgeSize="small">New Feature</span>
  `
})
```

### 15. MatSnackBar - Toast Notifications

Display brief messages at the bottom of the screen.

```typescript
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  imports: [MatSnackBarModule, MatButtonModule]
})
export class DashboardComponent {
  constructor(private snackBar: MatSnackBar) {}
  
  showNotification() {
    this.snackBar.open('Data saved successfully!', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
}
```

### 16. MatDialog - Modal Dialogs

Display content in an overlay dialog.

```typescript
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

@Component({
  standalone: true,
  imports: [MatDialogModule, MatButtonModule]
})
export class DashboardComponent {
  constructor(private dialog: MatDialog) {}
  
  openDialog() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Confirm Delete', message: 'Are you sure?' }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Confirmed');
      }
    });
  }
}

// Dialog Component
@Component({
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{data.title}}</h2>
    <mat-dialog-content>
      <p>{{data.message}}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Confirm</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
```

## Complete Dashboard Layout Example

Here's a complete shell component combining multiple Material components:

```typescript
import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    RouterOutlet,
    RouterLink
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <!-- Side Navigation -->
      <mat-sidenav #sidenav mode="side" opened class="sidenav">
        <div class="logo-container">
          <h2>Dashboard</h2>
        </div>
        
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          
          <a mat-list-item routerLink="/analytics" routerLinkActive="active">
            <mat-icon>analytics</mat-icon>
            <span>Analytics</span>
          </a>
          
          <a mat-list-item routerLink="/customers" routerLinkActive="active">
            <mat-icon>people</mat-icon>
            <span>Customers</span>
          </a>
          
          <a mat-list-item routerLink="/products" routerLinkActive="active">
            <mat-icon>inventory</mat-icon>
            <span>Products</span>
          </a>
          
          <a mat-list-item routerLink="/orders" routerLinkActive="active">
            <mat-icon matBadge="3" matBadgeColor="warn">shopping_cart</mat-icon>
            <span>Orders</span>
          </a>
          
          <mat-divider></mat-divider>
          
          <a mat-list-item routerLink="/settings" routerLinkActive="active">
            <mat-icon>settings</mat-icon>
            <span>Settings</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      
      <!-- Main Content Area -->
      <mat-sidenav-content>
        <!-- Top Toolbar -->
        <mat-toolbar color="primary">
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          
          <span>My Application</span>
          
          <span class="spacer"></span>
          
          <button mat-icon-button matBadge="8" matBadgeColor="warn">
            <mat-icon>notifications</mat-icon>
          </button>
          
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item>
              <mat-icon>person</mat-icon>
              <span>Profile</span>
            </button>
            <button mat-menu-item>
              <mat-icon>settings</mat-icon>
              <span>Settings</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item>
              <mat-icon>exit_to_app</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </mat-toolbar>
        
        <!-- Page Content -->
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }
    
    .sidenav {
      width: 250px;
    }
    
    .logo-container {
      padding: 16px;
      text-align: center;
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    mat-nav-list a {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    mat-nav-list a.active {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .content {
      padding: 24px;
      background-color: #f5f5f5;
      min-height: calc(100vh - 64px);
    }
  `]
})
export class ShellComponent {}
```

## Installation

To use Angular Material components, install the package:

```bash
ng add @angular/material
```

This command will:
- Install Angular Material, CDK, and Animations
- Add Material Design fonts and icons
- Set up global styles
- Configure animations

## Theme Configuration

Configure your theme in `styles.scss`:

```scss
@use '@angular/material' as mat;

@include mat.core();

$my-primary: mat.define-palette(mat.$indigo-palette);
$my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
$my-warn: mat.define-palette(mat.$red-palette);

$my-theme: mat.define-light-theme((
  color: (
    primary: $my-primary,
    accent: $my-accent,
    warn: $my-warn,
  )
));

@include mat.all-component-themes($my-theme);
```

## Best Practices

1. **Import only what you need** - Use specific module imports to optimize bundle size
2. **Use appearance consistently** - Stick to one form field appearance throughout your app
3. **Responsive design** - Use `MatSidenav` modes for responsive behavior
4. **Accessibility** - Material components are accessible by default, maintain ARIA labels
5. **Theme customization** - Define custom palettes for brand consistency
6. **Icon usage** - Use Material Icons or Font Awesome consistently
7. **Spacing** - Use consistent padding/margins (16px, 24px multiples)

## Common Dashboard Layout Grid

Use CSS Grid or Flexbox with Material Cards for dashboard widgets:

```typescript
@Component({
  template: `
    <div class="dashboard-grid">
      <mat-card class="dashboard-card">
        <mat-card-header>
          <mat-card-title>Total Revenue</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <h2>$45,231.89</h2>
          <p class="trend positive">+20.1%</p>
        </mat-card-content>
      </mat-card>
      
      <!-- More cards... -->
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      padding: 24px;
    }
    
    .dashboard-card {
      min-height: 150px;
    }
  `]
})
```

## Resources

- [Angular Material Official Documentation](https://material.angular.io/)
- [Material Design Guidelines](https://material.io/design)
- [Angular Material GitHub](https://github.com/angular/components)
- [Material Icons](https://fonts.google.com/icons)

---

These components provide everything needed to build a professional, modern dashboard in Angular 20!
