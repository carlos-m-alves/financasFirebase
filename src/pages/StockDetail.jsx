import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStocks } from '../hooks/useStocks';
import { fetchQuotes } from '../services/brapi';
import { getStockHistory } from '../services/firebase';
import { formatNumber, formatPercent } from '../utils/format';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import './StockDetail.css';

const RANGES = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1A', value: '1y' },
  { label: '2A', value: '2y' },
];

const RANGE_DAYS = { '1mo': 31, '3mo': 92, '6mo': 183, '1y': 366, '2y': 731 };

export default function StockDetail() {
  const { ticker } = useParams();
  const { stocks } = useStocks();
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState('1y');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [quotes, hist] = await Promise.all([
          fetchQuotes([ticker]),
          getStockHistory(ticker),
        ]);
        if (quotes?.length) setQuote(quotes[0].data);
        const rows = Object.entries(hist)
          .map(([date, d]) => ({ date, ...d }))
          .sort((a, b) => a.date.localeCompare(b.date));
        setHistory(rows);
      } catch (err) {
        console.error('Erro ao carregar detalhes:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ticker]);

  const cutoff = new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const visibleHistory = history.filter((d) => d.date >= cutoff);

  const portfolio = stocks[ticker];
  const price = quote?.regularMarketPrice || 0;
  const change = quote?.regularMarketChange || 0;
  const changePercent = quote?.regularMarketChangePercent || 0;
  const isPositive = change >= 0;
  const volume = quote?.regularMarketVolume;
  const high52 = quote?.fiftyTwoWeekHigh;
  const low52 = quote?.fiftyTwoWeekLow;

  let profit = 0;
  let profitPercent = 0;
  if (portfolio && price > 0) {
    const cost = portfolio.quantity * portfolio.purchasePrice;
    const current = portfolio.quantity * price;
    profit = current - cost;
    profitPercent = cost > 0 ? (profit / cost) * 100 : 0;
  }

  if (loading) {
    return (
      <div className="stock-detail">
        <p className="loading-text">Carregando {ticker}...</p>
      </div>
    );
  }

  const formatDate = (d) => {
    if (!d) return '';
    const s = String(d);
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  };

  return (
    <div className="stock-detail">
      <div className="detail-header">
        <div>
          <h1>{ticker}</h1>
          {quote?.longName && <p className="company-name">{quote.longName}</p>}
        </div>
        <div className="detail-price-info">
          <div className="detail-price">R$ {formatNumber(price)}</div>
          <div className={`detail-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{formatNumber(change)} ({isPositive ? '+' : ''}{formatPercent(changePercent)})
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {portfolio && (
          <div className="detail-card">
            <h3>Minha Posição</h3>
            <div className="position-row">
              <span>Quantidade</span>
              <span className="value">{portfolio.quantity}</span>
            </div>
            <div className="position-row">
              <span>Preço Médio</span>
              <span className="value">R$ {formatNumber(portfolio.purchasePrice)}</span>
            </div>
            <div className="position-row">
              <span>Total Investido</span>
              <span className="value">R$ {formatNumber(portfolio.quantity * portfolio.purchasePrice)}</span>
            </div>
            <div className={`position-row profit ${profit >= 0 ? 'positive' : 'negative'}`}>
              <span>Lucro/Prejuízo</span>
              <span className="value">
                {profit >= 0 ? '+' : ''}R$ {formatNumber(profit)} ({profitPercent >= 0 ? '+' : ''}{formatPercent(profitPercent)})
              </span>
            </div>
          </div>
        )}

        <div className="detail-card">
          <h3>Indicadores</h3>
          {low52 && (
            <div className="position-row">
              <span>Mínima 52 sem</span>
              <span className="value">R$ {formatNumber(low52)}</span>
            </div>
          )}
          {high52 && (
            <div className="position-row">
              <span>Máxima 52 sem</span>
              <span className="value">R$ {formatNumber(high52)}</span>
            </div>
          )}
          <div className="position-row">
            <span>Volume</span>
            <span className="value">{volume ? volume.toLocaleString('pt-BR') : '-'}</span>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h3>Histórico de Preços</h3>
          <div className="range-selector">
            {RANGES.map((r) => (
              <button
                key={r.value}
                className={`range-btn ${range === r.value ? 'active' : ''}`}
                onClick={() => setRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={visibleHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
            <XAxis
              dataKey="date"
              stroke="#666"
              tick={{ fontSize: 11 }}
              tickFormatter={(d) => formatDate(d)}
            />
            <YAxis
              stroke="#666"
              tick={{ fontSize: 11 }}
              domain={['auto', 'auto']}
              tickFormatter={(v) => formatNumber(v)}
            />
            <Tooltip
              formatter={(v) => `R$ ${formatNumber(v)}`}
              labelFormatter={(d) => formatDate(d)}
              contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: '0.85rem' }}
              labelStyle={{ color: '#888', fontWeight: 600 }}
              itemStyle={{ color: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke={isPositive ? '#4caf50' : '#f44336'}
              strokeWidth={2}
              dot={false}
              name="Fechamento"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
