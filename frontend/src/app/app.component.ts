import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { PageEditorComponent } from './components/page-editor/page-editor.component';
import { AiPanelComponent } from './components/ai-panel/ai-panel.component';
import { OnboardingModalComponent } from './components/onboarding-modal/onboarding-modal.component';
import { Page } from './models/types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    SidebarComponent,
    PageEditorComponent,
    AiPanelComponent,
    OnboardingModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  selectedPage: Page | null = null;
  sidebarOpen = true;
  aiPanelOpen = false;
  showOnboarding = false;

  ngOnInit() {
    if (!localStorage.getItem('onboarding_dismissed')) {
      this.showOnboarding = true;
    }
  }

  onPageSelected(page: Page) {
    this.selectedPage = page;
  }

  onPageUpdated(page: Page) {
    this.selectedPage = page;
    this.sidebar?.onTreeChanged();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleAiPanel() {
    this.aiPanelOpen = !this.aiPanelOpen;
  }
}
