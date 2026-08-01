import { useState } from 'react';
import { useStocks } from '../hooks/useStocks';
import { useFilter } from '../context/FilterContext';
import { usePrivacy } from '../context/PrivacyContext';
import StockCard from '../components/StockCard/StockCard';
import TickerFilter from '../components/TickerFilter/TickerFilter';
import EyeToggle from '../components/EyeToggle/EyeToggle';
import { fetchQuotes, fetchDividends, fetchFxRate } from '../services/brapi';
import { saveStockPrices } from '../services/firebase';
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
  const [testMsg, setTestMsg] = useState(null);
  const [savingPrices, setSavingPrices] = useState(false);
  const { isSelected } = useFilter();
  const { hideValues } = usePrivacy();
  const [sortByBr, setSortByBr] = useState('alpha');
  const [sortByUs, setSortByUs] = useState('alpha');
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

  const positionValue = (ticker) => {
    const s = stocks[ticker];
    return (s?.quantity || 0) * (s?.price || 0);
  };

  const profitPercent = (ticker) => {
    const s = stocks[ticker];
    const cost = (s?.quantity || 0) * (s?.purchasePrice || 0);
    const curr = positionValue(ticker);
    return cost > 0 ? ((curr - cost) / cost) * 100 : 0;
  };

  const sortTickers = (list, sortBy) => {
    const arr = [...list];
    switch (sortBy) {
      case 'valueDesc':
        return arr.sort((a, b) => positionValue(b) - positionValue(a));
      case 'valueAsc':
        return arr.sort((a, b) => positionValue(a) - positionValue(b));
      case 'profitDesc':
        return arr.sort((a, b) => profitPercent(b) - profitPercent(a));
      case 'profitAsc':
        return arr.sort((a, b) => profitPercent(a) - profitPercent(b));
      default:
        return arr.sort((a, b) => a.localeCompare(b));
    }
  };

  const sortedBr = sortTickers(brSymbols, sortByBr);
  const sortedUs = sortTickers(usSymbols, sortByUs);

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
      const dividendNote = !dividendResults.length
        ? " (dividendos indisponíveis: o plano Brapi atual não inclui esse dado)"
        : "";
      setTestMsg(
        "Preços e dividendos salvos em " + new Date().toLocaleTimeString("pt-BR") +
        (fxRate ? ` (US$ 1 = R$ ${formatNumber(fxRate)})` : "") + dividendNote
      );
    } catch (err) {
      setTestMsg("Erro: " + err.message);
    } finally {
      setSavingPrices(false);
    }
  };

  let totalInvested = 0;
  let totalValue = 0;
  let totalProfit = 0;

  symbols.forEach((ticker) => {
    const s = stocks[ticker];
    if (s) {
      const cost = (s.quantity || 0) * (s.purchasePrice || 0);
      const curr = (s.quantity || 0) * (s.price || 0);
      totalInvested += cost;
      totalValue += curr;
      totalProfit += curr - cost;
    }
  });

  if (loading) {
    return (
      <div className="dashboard">
        <p className="loading-text">Carregando carteira...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-state">
          <p>Erro ao conectar com o Firebase.</p>
          <p className="error-detail">{error}</p>
          <p className="error-hint">
            Certifique-se de que as regras do Realtime Database permitem seu acesso em:
            <br />
            <a href="https://console.firebase.google.com/project/financasfirebase/database/financasfirebase-default-rtdb/rules" target="_blank" rel="noopener noreferrer">
              console.firebase.google.com → Realtime Database → Rules
            </a>
            <br />
            A regra deve usar o mesmo UID/e-mail da sua sessão (Authentication → Users) e clicar em Publish.
          </p>
        </div>
      </div>
    );
  }

  if (!symbols.length) {
    return (
      <div className="dashboard">
        <div className="empty-state">
          <p>Nenhum ativo cadastrado ainda.</p>
          <p>Você pode adicionar manualmente em <strong>Portfolio</strong>.</p>
        </div>
      </div>
    );
  }

  const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const mask = (value) => (hideValues ? "R$ ••••••" : value);

  return (
    <div className="dashboard">
      <div className="toolbar">
        <button className="btn-primary" onClick={handleTestInsert} disabled={savingPrices}>
          {savingPrices ? "Buscando e salvando preços..." : "Buscar e salvar preços"}
        </button>
        {symbols.length > 0 && <TickerFilter tickers={symbols} />}
        <EyeToggle />
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

      <h2 className="section-header">
        Ativos Nacionais
        <span className="section-count">{brSymbols.length} {brSymbols.length === 1 ? 'ativo' : 'ativos'}</span>
        <select
          className="sort-select"
          value={sortByBr}
          onChange={(e) => setSortByBr(e.target.value)}
          title="Ordenar ativos nacionais"
        >
          <option value="alpha">Alfabética</option>
          <option value="valueDesc">Maior posição</option>
          <option value="valueAsc">Menor posição</option>
          <option value="profitDesc">Maior lucro %</option>
          <option value="profitAsc">Menor lucro %</option>
        </select>
      </h2>
      <div className="stocks-grid">
        {sortedBr.filter((t) => isSelected(t)).map((ticker) => (
          <StockCard
            key={ticker}
            ticker={ticker}
            portfolio={stocks}
            hideValues={hideValues}
          />
        ))}
      </div>

      <h2 className="section-header">
        Ativos Internacionais
        <span className="section-count">{usSymbols.length} {usSymbols.length === 1 ? 'ativo' : 'ativos'}</span>
        {usdRate && (
          <span className="usd-rate-label">Dólar hoje: R$ {formatNumber(usdRate)}</span>
        )}
        <select
          className="sort-select"
          value={sortByUs}
          onChange={(e) => setSortByUs(e.target.value)}
          title="Ordenar ativos internacionais"
        >
          <option value="alpha">Alfabética</option>
          <option value="valueDesc">Maior posição</option>
          <option value="valueAsc">Menor posição</option>
          <option value="profitDesc">Maior lucro %</option>
          <option value="profitAsc">Menor lucro %</option>
        </select>
      </h2>
      <div className="stocks-grid">
        {sortedUs.filter((t) => isSelected(t)).map((ticker) => (
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
