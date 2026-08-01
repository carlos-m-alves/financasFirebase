import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erro na aplicacao:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="login-page" style={{ padding: '2rem' }}>
          <div className="login-card">
            <h2>Erro na aplicacao</h2>
            <p className="error-detail" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {String(this.state.error)}
            </p>
            <p className="login-hint">Erro detalhado no console (F12).</p>
            <button
              className="btn-primary"
              onClick={() => this.setState({ error: null })}
              style={{ marginTop: '1rem' }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
