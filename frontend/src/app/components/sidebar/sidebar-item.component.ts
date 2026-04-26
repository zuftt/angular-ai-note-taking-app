import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageService } from '../../services/page.service';
import { Page } from '../../models/types';

@Component({
  selector: 'app-sidebar-item',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarItemComponent],
  template: `
    <div
      class="item-row"
      [class.selected]="page._id === selectedPageId"
      [style.padding-left.px]="depth * 16 + 4"
      draggable="true"
      (dragstart)="onDragStart($event)"
      (click)="select()"
    >
      <button
        class="chevron-btn"
        [class.has-children]="page.children && page.children.length > 0"
        (click)="toggleExpand($event)"
      >
        <span class="chevron" [class.expanded]="expanded">▶</span>
      </button>

      <span class="item-icon" (click)="pickIcon($event)">{{ page.icon || '📄' }}</span>

      <span class="item-title" *ngIf="!isRenaming">{{ page.title || 'Untitled' }}</span>
      <input
        *ngIf="isRenaming"
        class="rename-input"
        [(ngModel)]="renameValue"
        (keydown.enter)="commitRename()"
        (keydown.escape)="cancelRename()"
        (blur)="commitRename()"
        (click)="$event.stopPropagation()"
        #renameInput
      />

      <!-- Folder badge — visible by default, hidden on hover when actions appear -->
      <span *ngIf="folderName && !isRenaming" class="location-badge folder-badge" title="In folder: {{ folderName }}">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style="flex-shrink:0">
          <path d="M1 3.5C1 2.67 1.67 2 2.5 2H4.8l1 1.2H9.5c.83 0 1.5.67 1.5 1.5V8.5c0 .83-.67 1.5-1.5 1.5h-7C1.67 10 1 9.33 1 8.5v-5z" fill="currentColor" opacity=".7"/>
        </svg>
        {{ folderName }}
      </span>

      <div class="actions">
        <button class="action-btn" title="More options" (click)="showMenu($event)">•••</button>
        <button class="action-btn" title="Add child page" (click)="addChild($event)">+</button>
      </div>
    </div>

    <!-- Context menu -->
    <div *ngIf="menuOpen" class="ctx-menu" (click)="$event.stopPropagation()">
      <button class="ctx-item" (click)="startRename()">Rename</button>
      <button class="ctx-item" (click)="togglePin()">{{ page.isPinned ? 'Unpin' : 'Pin to favorites' }}</button>
      <button class="ctx-item ctx-item--danger" (click)="deleteSelf()">Delete</button>
    </div>

    <!-- Children with tree guide line -->
    <div class="tree-wrap" *ngIf="expanded && page.children && page.children.length > 0">
      <div class="tree-line" [style.left.px]="depth * 16 + 13"></div>
      <app-sidebar-item
        *ngFor="let child of page.children"
        [page]="child"
        [depth]="depth + 1"
        [selectedPageId]="selectedPageId"
        (pageSelected)="pageSelected.emit($event)"
        (treeChanged)="treeChanged.emit()"
      ></app-sidebar-item>
    </div>
  `,
  styles: [`
    :host { display: block; position: relative; }

    .item-row {
      display: flex;
      align-items: center;
      gap: 2px;
      padding-right: 6px;
      border-radius: 5px;
      cursor: pointer;
      height: 30px;
      font-size: 14.5px;
      color: var(--text-primary);
      position: relative;
      transition: background 80ms ease;
    }
    .item-row:hover { background: var(--bg-hover); }
    .item-row.selected {
      background: var(--bg-selected);
      font-weight: 500;
      color: var(--accent);
    }

    .chevron-btn {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 3px;
      flex-shrink: 0;
      padding: 0;
      color: var(--text-tertiary);
      opacity: 0;
      transition: opacity 80ms ease;
    }
    .item-row:hover .chevron-btn { opacity: 1; }
    .chevron-btn.has-children { opacity: 0.55; }
    .item-row:hover .chevron-btn.has-children { opacity: 1; }
    .chevron-btn:hover { background: var(--bg-hover); color: var(--text-secondary); }

    .chevron {
      font-size: 8px;
      display: inline-block;
      transition: transform 120ms ease;
    }
    .chevron.expanded { transform: rotate(90deg); }

    .item-icon {
      font-size: 15px;
      flex-shrink: 0;
      cursor: pointer;
      line-height: 1;
    }
    .item-icon:hover { opacity: 0.7; }

    .item-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 14px;
      letter-spacing: -0.005em;
    }

    .rename-input {
      flex: 1;
      font-size: 14px;
      border: 1.5px solid var(--accent);
      border-radius: 4px;
      padding: 2px 6px;
      background: var(--bg-primary);
      color: var(--text-primary);
      outline: none;
    }

    .actions {
      display: flex;
      gap: 1px;
      margin-left: auto;
      opacity: 0;
      flex-shrink: 0;
      transition: opacity 80ms ease;
    }
    .item-row:hover .actions { opacity: 1; }

    .action-btn {
      width: 22px;
      height: 22px;
      border-radius: 4px;
      border: none;
      background: transparent;
      color: var(--text-tertiary);
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      line-height: 1;
    }
    .action-btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .ctx-menu {
      position: absolute;
      left: 24px;
      top: 28px;
      z-index: 200;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 5px;
      min-width: 172px;
    }
    .ctx-item {
      display: flex;
      align-items: center;
      width: 100%;
      text-align: left;
      padding: 7px 10px;
      font-size: 13.5px;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--text-primary);
      transition: background 80ms ease;
    }
    .ctx-item:hover { background: var(--bg-hover); }
    .ctx-item--danger { color: var(--danger); }
    .ctx-item--danger:hover { background: rgba(224,62,62,0.09); }

    /* ── Tree guide line ──────────────────────────────────────────── */
    .tree-wrap { position: relative; }
    .tree-line {
      position: absolute;
      top: 3px;
      bottom: 8px;
      width: 1.5px;
      background: var(--border);
      border-radius: 1px;
      pointer-events: none;
    }

    /* ── Location badges ──────────────────────────────────────────── */
    .location-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10.5px;
      font-weight: 500;
      padding: 1px 6px 1px 4px;
      border-radius: 4px;
      flex-shrink: 0;
      white-space: nowrap;
      max-width: 72px;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: opacity 80ms ease;
      pointer-events: none;
    }
    .folder-badge {
      background: rgba(99, 102, 241, 0.1);
      color: #6366f1;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    /* fade out when actions are visible on hover */
    .item-row:hover .location-badge { opacity: 0; }
  `],
})
export class SidebarItemComponent implements OnInit {
  @Input() page!: Page;
  @Input() depth = 0;
  @Input() selectedPageId: string | null = null;
  @Input() folderName?: string;
  @Output() pageSelected = new EventEmitter<Page>();
  @Output() treeChanged = new EventEmitter<void>();

  expanded = false;
  menuOpen = false;
  isRenaming = false;
  renameValue = '';

  constructor(private pageService: PageService) {}

  ngOnInit() {
    // Auto-expand if a selected descendant exists
    if (this.selectedPageId && this.hasDescendant(this.page, this.selectedPageId)) {
      this.expanded = true;
    }
  }

  private hasDescendant(page: Page, id: string): boolean {
    return !!page.children?.some((c) => c._id === id || this.hasDescendant(c, id));
  }

  select() {
    if (!this.isRenaming) {
      this.menuOpen = false;
      this.pageSelected.emit(this.page);
    }
  }

  toggleExpand(e: Event) {
    e.stopPropagation();
    this.expanded = !this.expanded;
  }

  showMenu(e: Event) {
    e.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  addChild(e: Event) {
    e.stopPropagation();
    this.menuOpen = false;
    this.expanded = true;
    this.pageService.createPage({ title: 'Untitled', parentId: this.page._id }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.treeChanged.emit();
          this.pageSelected.emit(res.data);
        }
      },
    });
  }

  startRename() {
    this.menuOpen = false;
    this.renameValue = this.page.title || '';
    this.isRenaming = true;
    setTimeout(() => {
      const input = document.querySelector('.rename-input') as HTMLInputElement;
      input?.focus();
      input?.select();
    }, 10);
  }

  commitRename() {
    if (!this.isRenaming) return;
    this.isRenaming = false;
    const newTitle = this.renameValue.trim() || 'Untitled';
    if (newTitle !== this.page.title && this.page._id) {
      this.pageService.updatePage(this.page._id, { title: newTitle }).subscribe({
        next: () => this.treeChanged.emit(),
      });
    }
  }

  cancelRename() {
    this.isRenaming = false;
  }

  togglePin() {
    this.menuOpen = false;
    if (!this.page._id) return;
    this.pageService.updatePage(this.page._id, { isPinned: !this.page.isPinned }).subscribe({
      next: () => this.treeChanged.emit(),
    });
  }

  deleteSelf() {
    this.menuOpen = false;
    if (!this.page._id) return;
    this.pageService.deletePage(this.page._id).subscribe({
      next: () => this.treeChanged.emit(),
    });
  }

  onDragStart(e: DragEvent) {
    e.dataTransfer?.setData('pageId', this.page._id!);
    e.stopPropagation();
  }

  pickIcon(e: Event) {
    e.stopPropagation();
    const icons = ['📄', '📝', '📁', '💡', '⭐', '🚀', '📌', '🔖', '📊', '🎯', '💬', '🔑'];
    const current = this.page.icon || '📄';
    const next = icons[(icons.indexOf(current) + 1) % icons.length];
    if (!this.page._id) return;
    this.pageService.updatePage(this.page._id, { icon: next }).subscribe({
      next: () => this.treeChanged.emit(),
    });
  }
}
