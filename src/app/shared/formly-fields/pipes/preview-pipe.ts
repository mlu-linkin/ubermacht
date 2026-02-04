import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'preview',
  standalone: true,
  pure: true // This is the default, but good to see it!
})
export class PreviewPipe implements PipeTransform {
  transform(content: string, limit: number = 150): string {
    if (!content) return '';

    // The heavy DOM logic only runs when 'content' changes!
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || tempDiv.innerText || '';

    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }
}