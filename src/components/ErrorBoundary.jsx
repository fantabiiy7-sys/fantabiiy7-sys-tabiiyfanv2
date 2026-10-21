import { Component } from 'react';

// Kutilmagan xato bo'lsa, oq ekran o'rniga tushunarli xabar ko'rsatadi.
// Yangi deploydan keyin eski fayl topilmasa (chunk xatosi), sahifa bir marta avtomatik yangilanadi.
export class ErrorBoundary extends Component {
  state = { error: null, info: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    const msg = String(error?.message || '');
    const isChunk = /dynamically imported module|Failed to fetch|Importing a module script failed|Loading chunk/i.test(msg);
    try {
      if (isChunk && !sessionStorage.getItem('tf-reloaded')) {
        sessionStorage.setItem('tf-reloaded', '1');
        window.location.reload();
      }
    } catch {}
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <div className="crash-card">
          <h1>Sahifani ochishda xatolik / Ошибка / Error</h1>
          <p>Sahifani yangilang. Agar Chrome tarjimoni (Google Translate) yoqilgan bo‘lsa, uni o‘chiring — saytda o‘z til tanlagichi bor.</p>
          <code>{String(this.state.error?.message || this.state.error)}</code>
          <details>
            <summary className="muted small">Texnik ma’lumot</summary>
            <pre className="crash-stack">
            {String(this.state.error?.stack || '').split('\n').slice(0, 8).join('\n')}
            {'\n--- component ---'}
            {String(this.state.info?.componentStack || '').split('\n').slice(0, 8).join('\n')}
          </pre>
          </details>
          <div className="crash-actions">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Sahifani yangilash
            </button>
            <a className="btn btn-outline" href="/">
              Bosh sahifa
            </a>
          </div>
        </div>
      </div>
    );
  }
}
