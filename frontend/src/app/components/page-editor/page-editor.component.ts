import {
  Component, Input, Output, EventEmitter,
  OnChanges, SimpleChanges, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { PageService } from '../../services/page.service';
import { FolderService } from '../../services/folder.service';
import { Page } from '../../models/types';

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './page-editor.component.html',
  styleUrls: ['./page-editor.component.css'],
})
export class PageEditorComponent implements OnChanges {
  @Input() page: Page | null = null;
  @Input() sidebarOpen = true;
  @Input() aiPanelOpen = false;
  @Output() pageUpdated = new EventEmitter<Page>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleAiPanel = new EventEmitter<void>();

  @ViewChild('contentArea') contentArea!: ElementRef<HTMLTextAreaElement>;

  editing: Page | null = null;
  isSaving = false;
  saveTimeout: any;
  previewMode = false;

  locationParent: string | null = null;
  locationFolder: string | null = null;

  showCommandMenu = false;
  commandFilter = '';
  commandMenuItems = [
    { icon: '✨', label: 'Summarize note', action: 'summarize' },
    { icon: '🏷️', label: 'Generate tags', action: 'tags' },
    { icon: '💬', label: 'Ask about this note', action: 'ask' },
  ];

  readonly ICONS = ['📄', '📝', '📁', '💡', '⭐', '🚀', '📌', '🔖', '📊', '🎯', '💬', '🔑', '✅', '🎨', '🌟'];
  showIconPicker = false;

  constructor(
    private pageService: PageService,
    private folderService: FolderService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['page'] && this.page) {
      this.editing = { ...this.page };
      this.showCommandMenu = false;
      this.previewMode = false;
      this.resolveLocation();
    }
  }

  private resolveLocation() {
    this.locationParent = null;
    this.locationFolder = null;

    if (this.page?.parentId) {
      this.pageService.getPage(this.page.parentId).subscribe({
        next: (res) => {
          if (res.success && res.data) this.locationParent = res.data.title || 'Untitled';
        },
      });
    }

    if (this.page?.folderId) {
      this.folderService.getTree().subscribe({
        next: (res) => {
          const match = res.data?.find((f) => f._id === this.page?.folderId);
          if (match) this.locationFolder = match.name;
        },
      });
    }
  }

  get renderedMarkdown(): SafeHtml {
    const raw = marked.parse(this.editing?.content || '') as string;
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }

  get wordCount(): number {
    return this.editing?.content?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  }

  get readingTime(): string {
    const mins = Math.ceil(this.wordCount / 200);
    return `${mins} min read`;
  }

  onTitleChange(title: string) {
    if (this.editing) {
      this.editing.title = title;
      this.autoSave();
    }
  }

  onContentChange(content: string) {
    if (!this.editing) return;
    this.editing.content = content;

    const lines = content.split('\n');
    const lastLine = lines[lines.length - 1];
    if (lastLine === '/') {
      this.showCommandMenu = true;
      this.commandFilter = '';
    } else if (lastLine.startsWith('/') && this.showCommandMenu) {
      this.commandFilter = lastLine.slice(1).toLowerCase();
    } else {
      this.showCommandMenu = false;
    }

    this.autoSave();
  }

  onContentKeydown(e: KeyboardEvent) {
    if (this.showCommandMenu) {
      if (e.key === 'Escape') { this.showCommandMenu = false; e.preventDefault(); }
      if (e.key === 'Enter') {
        const items = this.filteredCommandItems;
        if (items.length > 0) { this.runCommand(items[0].action); e.preventDefault(); }
      }
    }
  }

  get filteredCommandItems() {
    if (!this.commandFilter) return this.commandMenuItems;
    return this.commandMenuItems.filter(i =>
      i.label.toLowerCase().includes(this.commandFilter)
    );
  }

  runCommand(action: string) {
    this.showCommandMenu = false;
    if (this.editing) {
      const content = this.editing.content.replace(/\/$/, '').replace(/\/\w*$/, '');
      this.editing.content = content;
    }
    this.toggleAiPanel.emit();
  }

  autoSave() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.save(), 1000);
  }

  save() {
    if (!this.editing?._id) return;
    this.isSaving = true;
    this.pageService.updatePage(this.editing._id, this.editing).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.data) this.pageUpdated.emit(res.data);
      },
      error: () => { this.isSaving = false; },
    });
  }

  setIcon(icon: string) {
    this.showIconPicker = false;
    if (!this.editing) return;
    this.editing.icon = icon;
    if (this.editing._id) {
      this.pageService.updatePage(this.editing._id, { icon }).subscribe({
        next: (res) => { if (res.success && res.data) this.pageUpdated.emit(res.data); },
      });
    }
  }

  removeTag(tag: string) {
    if (this.editing) {
      this.editing.tags = this.editing.tags.filter(t => t !== tag);
      this.autoSave();
    }
  }

  addTag(input: HTMLInputElement) {
    const tag = input.value.trim();
    if (this.editing && tag && !this.editing.tags.includes(tag)) {
      this.editing.tags.push(tag);
      input.value = '';
      this.autoSave();
    }
  }
}
