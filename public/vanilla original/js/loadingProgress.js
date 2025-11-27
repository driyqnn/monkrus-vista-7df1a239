// Loading progress indicator for better UX
export class LoadingProgress {
  constructor() {
    this.bar = null;
    this.text = null;
    this.createProgressBar();
  }

  createProgressBar() {
    // Create progress bar container
    const container = document.createElement('div');
    container.id = 'loading-progress';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: var(--card);
      padding: 16px;
      text-align: center;
      border-bottom: 1px solid var(--border);
      display: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Progress text
    this.text = document.createElement('div');
    this.text.style.cssText = `
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: 8px;
    `;
    this.text.textContent = 'Loading data...';

    // Progress bar background
    const barBg = document.createElement('div');
    barBg.style.cssText = `
      background: var(--border);
      height: 4px;
      border-radius: 2px;
      overflow: hidden;
      max-width: 400px;
      margin: 0 auto;
    `;

    // Progress bar fill
    this.bar = document.createElement('div');
    this.bar.style.cssText = `
      background: var(--accent-green);
      height: 100%;
      width: 0%;
      transition: width 0.3s ease;
      border-radius: 2px;
    `;

    barBg.appendChild(this.bar);
    container.appendChild(this.text);
    container.appendChild(barBg);
    document.body.appendChild(container);
    
    this.container = container;
  }

  show(message = 'Loading data...') {
    this.text.textContent = message;
    this.container.style.display = 'block';
    // Force reflow
    this.container.offsetHeight;
    this.container.style.opacity = '1';
  }

  update(percent, message) {
    this.bar.style.width = `${Math.min(percent, 100)}%`;
    if (message) {
      this.text.textContent = message;
    }
  }

  hide() {
    this.container.style.opacity = '0';
    setTimeout(() => {
      this.container.style.display = 'none';
      this.bar.style.width = '0%';
    }, 300);
  }

  error(message = 'Failed to load data') {
    this.text.textContent = message;
    this.bar.style.background = 'var(--destructive)';
    this.bar.style.width = '100%';
    
    setTimeout(() => {
      this.hide();
      this.bar.style.background = 'var(--accent-green)';
    }, 3000);
  }
}

export const loadingProgress = new LoadingProgress();
