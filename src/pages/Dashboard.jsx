import { useState, useEffect } from 'react';
import { useStocks } from '../hooks/useStocks';
import StockCard from '../components/StockCard/StockCard';
import PortfolioPieChart from '../components/Charts/PortfolioPieChart';
import EquityAreaChart from '../components/Charts/EquityAreaChart';
import { seedDefaultStocks, INITIAL_STOCKS } from '../services/seedData';
import { fetchQuotes, fetchDividends, fetchFxRate } from '../services/brapi';
import { saveStockPrices, getAllHistory } from '../services/firebase';
import { formatNumber } from '../utils/format';
import './Dashboard.css';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function calcDividendYield(dividendResults, quoteMap) {
  const yields = {};
  const cutoff = Date.now() - ONE_YEAR_MS;
  dividendResults.forEach((item) => {
    const price = quoteMap[item.symbol]?.regularMarketPrice;
    const cash = item.data?.cashDividends || [];
    const total = cash
      .filter((d) => new Date(d.paymentDate).getTime() >= cutoff)
      .reduce((sum, d) => sum + (d.rate || 0), 0);
    yields[item.symbol] = price && price > 0 ? (total / price) * 100 : null;
  });
  return yields;
}

export default function Dashboard() {
  const { stocks, loading, error, refresh } = useStocks();
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState(null);
  const [testMsg, setTestMsg] = useState(null);
  const [savingPrices, setSavingPrices] = useState(false);
  const [equityData, setEquityData] = useState([]);
  const [hideValues, setHideValues] = useState(false);
  const symbols = Object.keys(stocks);
  const brSymbols = symbols.filter((t) => stocks[t]?.currency !== 'USD');
  const usSymbols = symbols.filter((t) => stocks[t]?.currency === 'USD');

  let usdRate = null;
  let usdRateUpdatedAt = null;
  usSymbols.forEach((t) => {
    const fx = stocks[t]?.fxRate;
    const ts = stocks[t]?.updatedAt;
    if (fx && (!usdRateUpdatedAt || ts > usdRateUpdatedAt)) {
      usdRate = fx;
      usdRateUpdatedAt = ts;
    }
  });

  useEffect(() => {
    let cancelled = false;
    const loadEquity = async () => {
      if (!Object.keys(stocks).length) return;
      const history = await getAllHistory().catch(() => ({}));
      if (cancelled) return;

      const invested = {};
      const fx = {};
      let totalInvested = 0;
      for (const [ticker, s] of Object.entries(stocks)) {
        invested[ticker] = (s.quantity || 0) * (s.purchasePrice || 0);
        totalInvested += invested[ticker];
        fx[ticker] = s.currency === 'USD' ? (s.fxRate || 1) : 1;
      }

      const byDate = {};
      for (const [ticker, days] of Object.entries(history)) {
        if (!stocks[ticker]) continue;
        const qty = stocks[ticker].quantity || 0;
        for (const [date, d] of Object.entries(days)) {
          if (!byDate[date]) byDate[date] = 0;
          byDate[date] += qty * (d.close || 0) * fx[ticker];
        }
      }

      const rows = Object.entries(byDate)
        .map(([date, value]) => ({ date, invested: totalInvested, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
      setEquityData(rows);
    };
    loadEquity();
    return () => { cancelled = true; };
  }, [stocks]);

  const handleTestInsert = async () => {
    setTestMsg(null);
    try {
      if (!symbols.length) {
        setTestMsg("Nenhum ativo cadastrado");
        return;
      }
      setSavingPrices(true);
      const [quoteResults, dividendResults, fxRate] = await Promise.all([
        fetchQuotes(symbols),
        fetchDividends(symbols),
        fetchFxRate().catch(() => null),
      ]);
      const quoteMap = {};
      quoteResults.forEach((item) => { quoteMap[item.symbol] = item.data; });
      const dividendYields = calcDividendYield(dividendResults, quoteMap);
      await saveStockPrices(quoteMap, dividendYields, fxRate);
      await refresh();
      setTestMsg(
        "Preços e dividendos salvos em " + new Date().toLocaleTimeString("pt-BR") +
        (fxRate ? ` (US$ 1 = R$ ${formatNumber(fxRate)})` : "")
      );
    } catch (err) {
      setTestMsg("Erro: " + err.message);
    } finally {
      setSavingPrices(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedError(null);
    try {
      await seedDefaultStocks();
      await refresh();
    } catch (err) {
      setSeedError(err.message || 'Erro ao popular dados. Verifique se o Firestore está ativo.');
    } finally {
      setSeeding(false);
    }
  };

  let totalInvested = 0;
  let totalValue = 0;
  let totalProfit = 0;
  const pieData = [];

  symbols.forEach((ticker) => {
    const s = stocks[ticker];
    if (s) {
      const cost = (s.quantity || 0) * (s.purchasePrice || 0);
      const curr = (s.quantity || 0) * (s.price || 0);
      totalInvested += cost;
      totalValue += curr;
      totalProfit += curr - cost;
      if (curr > 0) pieData.push({ ticker, value: curr });
    }
  });

  if (loading) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <p className="loading-text">Carregando carteira...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <div className="error-state">
          <p>Erro ao conectar com o Firebase.</p>
          <p className="error-detail">{error}</p>
          <p className="error-hint">
            Certifique-se de que o Firestore está ativo em:
            <br />
            <a href="https://console.firebase.google.com/project/financasfirebase/firestore" target="_blank" rel="noopener noreferrer">
              https://console.firebase.google.com/project/financasfirebase/firestore
            </a>
            <br />
            Crie o banco no modo de teste e recarregue a página.
          </p>
        </div>
      </div>
    );
  }

  if (!symbols.length) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <div className="empty-state">
          <p>Nenhum ativo cadastrado ainda.</p>
          <p>Você pode adicionar manualmente em <strong>Portfolio</strong> ou popular com os dados iniciais.</p>
          {seedError && <p className="error-detail">{seedError}</p>}
          <button className="btn-primary" onClick={handleSeed} disabled={seeding} style={{ marginTop: '1rem' }}>
            {seeding ? 'Populando...' : 'Popular 32 ativos iniciais'}
          </button>
        </div>
      </div>
    );
  }

  const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const mask = (value) => (hideValues ? "R$ ••••••" : value);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="toolbar">
        <button className="btn-primary" onClick={handleTestInsert} disabled={savingPrices}>
          {savingPrices ? "Buscando e salvando preços..." : "Buscar e salvar preços"}
        </button>
        <button
          className="btn-icon"
          onClick={() => setHideValues(!hideValues)}
          title={hideValues ? "Mostrar valores" : "Ocultar valores"}
        >
          {hideValues ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
        {testMsg && (
          <span className={`toolbar-msg ${testMsg.startsWith("Erro") ? 'error' : 'success'}`}>
            {testMsg}
          </span>
        )}
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total Investido</span>
          <span className="summary-value">{mask(formatNumber(totalInvested))}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Valor Atual</span>
          <span className="summary-value">{mask(formatNumber(totalValue))}</span>
        </div>
        <div className={`summary-card ${totalProfit >= 0 ? 'positive' : 'negative'}`}>
          <span className="summary-label">Lucro/Prejuízo</span>
          <span className="summary-value">
            {hideValues ? "R$ ••••••" : `${totalProfit >= 0 ? '+' : ''}R$ ${formatNumber(totalProfit)} (${totalProfitPercent >= 0 ? '+' : ''}${formatNumber(totalProfitPercent)}%)`}
          </span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Distribuição da Carteira</h3>
          {pieData.length ? <PortfolioPieChart data={pieData} /> : <p className="chart-empty">Sem dados para exibir</p>}
        </div>
        <div className="chart-card">
          <h3>Evolução Patrimonial</h3>
          {equityData.length ? <EquityAreaChart data={equityData} /> : <p className="chart-empty">Rode "Buscar e salvar preços" e depois atualize o histórico para gerar o gráfico</p>}
        </div>
      </div>

      <h2>Ativos Nacionais</h2>
      <div className="stocks-grid">
        {brSymbols.map((ticker) => (
          <StockCard
            key={ticker}
            ticker={ticker}
            portfolio={stocks}
            hideValues={hideValues}
          />
        ))}
      </div>

      <h2>
        Ativos Internacionais
        {usdRate && (
          <span className="usd-rate-label">Dólar hoje: R$ {formatNumber(usdRate)}</span>
        )}
      </h2>
      <div className="stocks-grid">
        {usSymbols.map((ticker) => (
          <StockCard
            key={ticker}
            ticker={ticker}
            portfolio={stocks}
            hideValues={hideValues}
          />
        ))}
      </div>
    </div>
  );
}
