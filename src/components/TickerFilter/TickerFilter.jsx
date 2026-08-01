import { useState } from 'react';
import { useFilter } from '../../context/FilterContext';
import './TickerFilter.css';

export default function TickerFilter({ tickers }) {
  const { excluded, toggle, selectAll, excludeAll } = useFilter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const visible = tickers.filter((t) => t.toUpperCase().includes(query.toUpperCase()));
  const selectedCount = tickers.filter((t) => !excluded.has(t)).length;

  return (
    <div className="ticker-filter">
      <button className="filter-toggle" onClick={() => setOpen(!open)}>
        <svg className="filter-toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Ativos: {selectedCount === tickers.length ? 'Todos' : `${selectedCount}/${tickers.length}`}
      </button>
      {open && (
        <>
          <div className="filter-backdrop" onClick={() => setOpen(false)} />
          <div className="filter-panel">
            <input
              className="filter-search"
              placeholder="Buscar ativo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="filter-actions">
              <button
                onClick={() => {
                  selectAll();
                  setQuery('');
                }}
              >
                Tudo
              </button>
              <button
                onClick={() => {
                  excludeAll(tickers);
                  setQuery('');
                }}
              >
                Nenhum
              </button>
            </div>
            <div className="filter-list">
              {visible.map((t) => (
                <label key={t} className="filter-item">
                  <input type="checkbox" checked={!excluded.has(t)} onChange={() => toggle(t)} />
                  {t}
                </label>
              ))}
              {!visible.length && <p className="filter-empty">Nenhum ativo encontrado</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
