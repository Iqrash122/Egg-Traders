import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Egg Supply Tracker runtime error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-white border border-rose-200 p-6 shadow-lg">
            <h1 className="font-bold text-lg text-rose-700">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600">
              {this.state.error?.message || String(this.state.error)}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold cursor-pointer"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('egg_supply_tracker_data_v1');
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm font-semibold cursor-pointer"
              >
                Reset Local Cache
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
