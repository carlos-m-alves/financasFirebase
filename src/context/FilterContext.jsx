import { createContext, useContext, useState } from 'react';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [excluded, setExcluded] = useState(() => new Set());

  const toggle = (ticker) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const selectAll = () => setExcluded(new Set());

  const excludeAll = (tickers) => setExcluded(new Set(tickers));

  const isSelected = (ticker) => !excluded.has(ticker);

  return (
    <FilterContext.Provider value={{ excluded, toggle, selectAll, excludeAll, isSelected }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilter deve ser usado dentro de FilterProvider');
  return ctx;
}
