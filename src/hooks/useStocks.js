import { useState, useEffect, useCallback } from 'react';
import { getAllStocks, saveStock, removeStock } from '../services/firebase';

export function useStocks() {
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllStocks();
      setStocks(data);
    } catch (err) {
      console.error('Erro ao carregar ativos:', err);
      setError(err.message || 'Erro ao conectar com Firebase');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  const addStock = async (ticker, data) => {
    await saveStock(ticker, data);
    await loadStocks();
  };

  const deleteStock = async (ticker) => {
    await removeStock(ticker);
    await loadStocks();
  };

  return { stocks, loading, error, addStock, deleteStock, refresh: loadStocks };
}
