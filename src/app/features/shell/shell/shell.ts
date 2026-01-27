import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, MatToolbar, MatButton, MatIcon],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {}
