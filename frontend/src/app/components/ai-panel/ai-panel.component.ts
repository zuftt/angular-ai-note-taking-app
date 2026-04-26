import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EdgeLlmService } from '../../services/edge-llm.service';
import { PageService } from '../../services/page.service';
import { Page, ChatMessage } from '../../models/types';

@Component({
  selector: 'app-ai-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-panel.component.html',
  styleUrls: ['./ai-panel.component.css'],
})
export class AiPanelComponent implements OnInit, OnChanges {
  @Input() page: Page | null = null;
  @Output() close = new EventEmitter<void>();

  isLoading = false;
  messages: ChatMessage[] = [];
  userQuestion = '';

  constructor(
    private llmService: EdgeLlmService,
    private pageService: PageService,
  ) {}

  ngOnInit() {
    this.llmService.loading$.subscribe(loading => { this.isLoading = loading; });
  }

  ngOnChanges() {
    this.messages = [];
  }

  async summarize() {
    if (!this.page?.content) return;
    try {
      const summary = await this.llmService.summarize(this.page.content);
      this.messages.push({ role: 'assistant', content: `**Summary:** ${summary}` });
      if (this.page._id) {
        this.pageService.updatePage(this.page._id, { summary }).subscribe();
      }
    } catch (e: any) {
      this.messages.push({ role: 'assistant', content: `Error: ${e.message}` });
    }
  }

  async generateTags() {
    if (!this.page?.content) return;
    try {
      const tags = await this.llmService.generateTags(this.page.content);
      if (this.page._id) {
        this.pageService.updatePage(this.page._id, { tags }).subscribe();
      }
      this.messages.push({ role: 'assistant', content: `Tags generated: ${tags.map(t => `#${t}`).join('  ')}` });
    } catch (e: any) {
      this.messages.push({ role: 'assistant', content: `Error: ${e.message}` });
    }
  }

  async askQuestion() {
    if (!this.page || !this.userQuestion.trim()) return;
    const question = this.userQuestion;
    this.messages.push({ role: 'user', content: question });
    this.userQuestion = '';
    try {
      const answer = await this.llmService.ask(question, this.page.content);
      this.messages.push({ role: 'assistant', content: answer });
    } catch (e: any) {
      this.messages.push({ role: 'assistant', content: `Error: ${e.message}` });
    }
  }
}
