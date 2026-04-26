import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-onboarding-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" (click)="onOverlayClick($event)">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-badge">✦ AI-Powered</div>
          <h2 class="modal-title">Welcome to your AI notes</h2>
          <p class="modal-sub">This app is supercharged with AI — here's what you can do.</p>
        </div>

        <div class="features">
          <div class="feature">
            <span class="feat-icon">✨</span>
            <div>
              <div class="feat-title">Summarize any note</div>
              <div class="feat-desc">Instantly condense long notes into key points.</div>
            </div>
          </div>
          <div class="feature">
            <span class="feat-icon">🏷️</span>
            <div>
              <div class="feat-title">Auto-generate tags</div>
              <div class="feat-desc">AI reads your content and suggests relevant tags.</div>
            </div>
          </div>
          <div class="feature">
            <span class="feat-icon">💬</span>
            <div>
              <div class="feat-title">Ask questions</div>
              <div class="feat-desc">Chat with AI about any open page — ask, clarify, expand.</div>
            </div>
          </div>
          <div class="feature">
            <span class="feat-icon">⚡</span>
            <div>
              <div class="feat-title">Slash commands</div>
              <div class="feat-desc">Type <code>/</code> in any note to trigger AI actions inline.</div>
            </div>
          </div>
        </div>

        <div class="modal-hint">
          Open a note and click the <strong>✦ Ask AI</strong> button in the top-right to get started.
        </div>

        <div class="modal-footer">
          <label class="no-show-label">
            <input type="checkbox" [(ngModel)]="dontShowAgain" />
            Don't show again
          </label>
          <button class="btn-primary" (click)="dismiss()">Got it →</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal {
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.25);
      width: 100%;
      max-width: 440px;
      padding: 32px;
      animation: slide-up 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slide-up {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .modal-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 99px;
      background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.12));
      border: 1px solid rgba(124,58,237,0.25);
      font-size: 12px;
      font-weight: 600;
      color: #7c3aed;
      margin-bottom: 14px;
    }

    .modal-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.025em;
      color: var(--text-primary);
      margin: 0 0 6px;
    }

    .modal-sub {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0 0 24px;
      line-height: 1.5;
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 22px;
    }

    .feature {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .feat-icon {
      font-size: 22px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .feat-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .feat-desc {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.45;
    }

    .modal-hint {
      background: var(--bg-secondary);
      border-radius: var(--radius-lg);
      padding: 12px 14px;
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .modal-hint strong { color: var(--text-primary); }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .no-show-label {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      color: var(--text-secondary);
      cursor: pointer;
      user-select: none;
    }
    .no-show-label input { cursor: pointer; accent-color: var(--accent); }

    .btn-primary {
      padding: 9px 20px;
      border-radius: 99px;
      background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      border: none;
      box-shadow: 0 2px 8px rgba(124,58,237,0.35);
      transition: box-shadow 150ms ease, transform 80ms ease;
    }
    .btn-primary:hover {
      box-shadow: 0 4px 16px rgba(124,58,237,0.5);
      transform: translateY(-1px);
    }

    code {
      background: var(--bg-hover);
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 12px;
      font-family: 'SF Mono', monospace;
      color: var(--text-primary);
    }
  `],
})
export class OnboardingModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  dontShowAgain = false;

  ngOnInit() {}

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay')) this.dismiss();
  }

  dismiss() {
    if (this.dontShowAgain) {
      localStorage.setItem('onboarding_dismissed', '1');
    }
    this.closed.emit();
  }
}
