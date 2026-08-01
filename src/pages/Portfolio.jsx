import { useState } from 'react';
import { useStocks } from '../hooks/useStocks';
import { useFilter } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import EyeToggle from '../components/EyeToggle/EyeToggle';
import TickerFilter from '../components/TickerFilter/TickerFilter';
import { formatNumber } from '../utils/format';
import './Portfolio.css';

export default function Portfolio() {
  const { stocks, loading, error, addStock, deleteStock } = useStocks();
  const { user } = useAuth();
  const { isSelected } = useFilter();
  const { hideValues } = usePrivacy();
  const [form, setForm] = useState({ ticker: '', quantity: '', purchasePrice: '', purchaseDate: '' });
  const [editMode, setEditMode] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ticker || !form.quantity || !form.purchasePrice) return;

    await addStock(form.ticker.toUpperCase().trim(), {
      quantity: Number(form.quantity),
      purchasePrice: Number(form.purchasePrice),
      purchaseDate: form.purchaseDate || new Date().toISOString().split('T')[0],
    });

    setForm({ ticker: '', quantity: '', purchasePrice: '', purchaseDate: '' });
    setShowForm(false);
    setEditMode(null);
  };

  const handleEdit = (ticker, data) => {
    setForm({
      ticker,
      quantity: data.quantity.toString(),
      purchasePrice: data.purchasePrice.toString(),
      purchaseDate: data.purchaseDate || '',
    });
    setEditMode(ticker);
    setShowForm(true);
  };

  const handleDelete = async (ticker) => {
    if (window.confirm(`Remover ${ticker} da carteira?`)) {
      await deleteStock(ticker);
    }
  };

  const handleCancel = () => {
    setForm({ ticker: '', quantity: '', purchasePrice: '', purchaseDate: '' });
    setShowForm(false);
    setEditMode(null);
  };

  if (loading) {
    return (
      <div className="portfolio-page">
        <h1>Portfolio</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-page">
        <h1>Portfolio</h1>
        <div className="error-state">
          <p>Erro ao carregar a carteira.</p>
          <p className="error-detail">{error}</p>
          {user && (
            <p className="error-detail">
              Sua sessão: {user.email} (UID: {user.uid})
            </p>
          )}
          <p className="error-hint">
            Verifique as regras do Realtime Database em
            <br />
            <a href="https://console.firebase.google.com/project/financasfirebase/database/financasfirebase-default-rtdb/rules" target="_blank" rel="noopener noreferrer">
              console.firebase.google.com → Realtime Database → Rules
            </a>
            <br />
            e confirme que o UID/e-mail autorizado corresponde ao seu usuário em Authentication → Users.
          </p>
        </div>
      </div>
    );
  }

  const filteredEntries = Object.entries(stocks).filter(([ticker]) => isSelected(ticker));

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <h1>Portfolio</h1>
        <div className="portfolio-actions">
          {Object.keys(stocks).length > 0 && <TickerFilter tickers={Object.keys(stocks)} />}
          <EyeToggle />
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Adicionar Ativo
          </button>
        </div>
      </div>

      {showForm && (
        <form className="stock-form" onSubmit={handleSubmit}>
          <h3>{editMode ? 'Editar Ativo' : 'Adicionar Ativo'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Ticker</label>
              <input
                type="text"
                placeholder="EX: PETR4"
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value })}
                disabled={!!editMode}
                required
              />
            </div>
            <div className="form-group">
              <label>Quantidade</label>
              <input
                type="number"
                step="1"
                min="1"
                placeholder="100"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Preço Pago (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="37.50"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Data da Compra</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editMode ? 'Salvar' : 'Adicionar'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="portfolio-table-wrapper">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Quantidade</th>
              <th>Preço Pago</th>
              <th>Total Pago</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  {Object.keys(stocks).length === 0
                    ? 'Nenhum ativo cadastrado'
                    : 'Nenhum ativo corresponde ao filtro selecionado'}
                </td>
              </tr>
            ) : (
              filteredEntries.map(([ticker, data]) => (
                <tr key={ticker}>
                  <td className="ticker-cell">{ticker}</td>
                  <td>{data.quantity}</td>
                  <td>{hideValues ? 'R$ ••••••' : `R$ ${formatNumber(data.purchasePrice)}`}</td>
                  <td>{hideValues ? 'R$ ••••••' : `R$ ${formatNumber((data.quantity || 0) * (data.purchasePrice || 0))}`}</td>
                  <td>{data.purchaseDate || '-'}</td>
                  <td className="actions-cell">
                    <button className="btn-action edit" onClick={() => handleEdit(ticker, data)}>
                      Editar
                    </button>
                    <button className="btn-action delete" onClick={() => handleDelete(ticker)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
