import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageService } from '../../services/page.service';
import { FolderService } from '../../services/folder.service';
import { ThemeService } from '../../services/theme.service';
import { Page, Folder } from '../../models/types';
import { SidebarItemComponent } from './sidebar-item.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarItemComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  @Input() selectedPageId: string | null = null;
  @Output() pageSelected = new EventEmitter<Page>();

  @ViewChild('folderNameInput') folderNameInput!: ElementRef<HTMLInputElement>;

  tree: Page[] = [];
  folderTree: Folder[] = [];
  folderPages: Record<string, Page[]> = {};
  expandedFolders: Set<string> = new Set();

  searchQuery = '';
  searchResults: Page[] = [];
  isSearching = false;

  renamingFolderId: string | null = null;
  renameFolderValue = '';
  creatingFolder = false;
  newFolderName = '';
  dragOverFolderId: string | null = null;
  dragOverRoot = false;

  constructor(
    private pageService: PageService,
    private folderService: FolderService,
    public theme: ThemeService,
  ) {}

  ngOnInit() {
    this.loadTree();
    this.loadFolders();
  }

  loadTree() {
    this.pageService.getTree('null').subscribe({
      next: (res) => {
        if (res.success && res.data) this.tree = res.data;
      },
      error: (err) => console.error('Failed to load tree:', err),
    });
  }

  loadFolders() {
    this.folderService.getTree().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.folderTree = res.data;
          this.folderTree.forEach((f) => {
            if (f._id) this.loadFolderPages(f._id);
          });
        }
      },
    });
  }

  loadFolderPages(folderId: string) {
    this.pageService.getTree(folderId).subscribe({
      next: (res) => {
        if (res.success && res.data) this.folderPages = { ...this.folderPages, [folderId]: res.data };
      },
    });
  }

  toggleFolder(folderId: string) {
    if (this.expandedFolders.has(folderId)) {
      this.expandedFolders.delete(folderId);
    } else {
      this.expandedFolders.add(folderId);
      this.loadFolderPages(folderId);
    }
  }

  onSearch(query: string) {
    this.searchQuery = query;
    if (!query.trim()) {
      this.isSearching = false;
      this.searchResults = [];
      return;
    }
    this.isSearching = true;
    this.pageService.searchPages(query).subscribe({
      next: (res) => {
        if (res.success && res.data) this.searchResults = res.data;
      },
    });
  }

  selectPage(page: Page) {
    this.pageSelected.emit(page);
  }

  createRootPage() {
    this.pageService.createPage({ title: 'Untitled', parentId: null, folderId: null }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.loadTree();
          this.pageSelected.emit(res.data);
        }
      },
    });
  }

  createPageInFolder(folderId: string) {
    this.pageService.createPage({ title: 'Untitled', parentId: null, folderId }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.loadFolderPages(folderId);
          this.expandedFolders.add(folderId);
          this.pageSelected.emit(res.data);
        }
      },
    });
  }

  startCreateFolder() {
    this.creatingFolder = true;
    this.newFolderName = '';
    setTimeout(() => this.folderNameInput?.nativeElement?.focus(), 10);
  }

  commitCreateFolder() {
    const name = this.newFolderName.trim();
    this.creatingFolder = false;
    if (!name) return;
    this.folderService.createFolder({ name, parentId: null }).subscribe({
      next: () => this.loadFolders(),
    });
  }

  cancelCreateFolder() {
    this.creatingFolder = false;
  }

  startRenameFolder(folder: Folder, e: Event) {
    e.stopPropagation();
    this.renamingFolderId = folder._id!;
    this.renameFolderValue = folder.name;
    setTimeout(() => {
      const el = document.querySelector('.folder-rename-input') as HTMLInputElement;
      el?.focus(); el?.select();
    }, 10);
  }

  commitRenameFolder(folderId: string) {
    const name = this.renameFolderValue.trim() || 'Untitled';
    this.renamingFolderId = null;
    this.folderService.updateFolder(folderId, { name }).subscribe({
      next: () => this.loadFolders(),
    });
  }

  cancelRenameFolder() {
    this.renamingFolderId = null;
  }

  deleteFolder(folderId: string, e: Event) {
    e.stopPropagation();
    this.folderService.deleteFolder(folderId, true).subscribe({
      next: () => {
        this.expandedFolders.delete(folderId);
        const { [folderId]: _, ...rest } = this.folderPages;
        this.folderPages = rest;
        this.loadFolders();
        this.loadTree();
      },
    });
  }

  onDragOverFolder(e: DragEvent, folderId: string) {
    e.preventDefault();
    e.stopPropagation();
    this.dragOverFolderId = folderId;
    this.dragOverRoot = false;
  }

  onDragLeaveFolder() {
    this.dragOverFolderId = null;
  }

  onDragOverRoot(e: DragEvent) {
    e.preventDefault();
    this.dragOverRoot = true;
    this.dragOverFolderId = null;
  }

  onDragLeaveRoot() {
    this.dragOverRoot = false;
  }

  dropOnFolder(e: DragEvent, folderId: string) {
    e.preventDefault();
    e.stopPropagation();
    this.dragOverFolderId = null;
    const pageId = e.dataTransfer?.getData('pageId');
    if (!pageId) return;
    this.pageService.updatePage(pageId, { folderId }).subscribe({
      next: () => {
        this.loadTree();
        this.loadFolderPages(folderId);
        this.expandedFolders.add(folderId);
      },
    });
  }

  dropOnRoot(e: DragEvent) {
    e.preventDefault();
    this.dragOverRoot = false;
    const pageId = e.dataTransfer?.getData('pageId');
    if (!pageId) return;
    this.pageService.updatePage(pageId, { folderId: null }).subscribe({
      next: () => {
        this.loadTree();
        this.folderTree.forEach((f) => {
          if (f._id && this.expandedFolders.has(f._id)) this.loadFolderPages(f._id);
        });
      },
    });
  }

  unpinPage(page: Page, e: Event) {
    e.stopPropagation();
    if (!page._id) return;
    this.pageService.updatePage(page._id, { isPinned: false }).subscribe({
      next: () => this.loadTree(),
    });
  }

  onTreeChanged() {
    this.loadTree();
    this.folderTree.forEach((f) => {
      if (f._id && this.expandedFolders.has(f._id)) this.loadFolderPages(f._id);
    });
  }

  get pinnedPages(): Page[] {
    const fromTree = this.flattenTree(this.tree).filter((p) => p.isPinned);
    const fromFolders = Object.values(this.folderPages)
      .flat()
      .filter((p) => p.isPinned);
    const seen = new Set<string>();
    return [...fromTree, ...fromFolders].filter((p) => {
      if (!p._id || seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });
  }

  get foldersById(): Record<string, string> {
    const map: Record<string, string> = {};
    this.folderTree.forEach((f) => { if (f._id) map[f._id] = f.name; });
    return map;
  }

  private flattenTree(pages: Page[]): Page[] {
    return pages.reduce<Page[]>((acc, p) => {
      acc.push(p);
      if (p.children?.length) acc.push(...this.flattenTree(p.children));
      return acc;
    }, []);
  }
}
