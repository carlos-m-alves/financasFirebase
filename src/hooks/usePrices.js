import { useState, useEffect, useRef } from 'react';
import { fetchQuotes } from '../services/brapi';

export function usePrices(symbols) {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!symbols?.length) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const results = await fetchQuotes(symbols);
        const quoteMap = {};
        results.forEach((item) => {
          quoteMap[item.symbol] = item.data;
        });
        setPrices(quoteMap);
      } catch (err) {
        console.error('Erro ao buscar cotações:', err);
      } finally {
        setLoading(false);
      }
    };

    load();

    intervalRef.current = setInterval(load, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [symbols?.join(',')]);

  return { prices, loading };
}
