import { useNavigate } from 'react-router-dom';
import { formatNumber, formatPercent } from '../../utils/format';
import './StockCard.css';

export default function StockCard({ ticker, quote, portfolio, hideValues = false }) {
  const navigate = useNavigate();
  const portfolioItem = portfolio?.[ticker];

  const price = quote?.regularMarketPrice ?? portfolioItem?.price;
  const change = quote?.regularMarketChange ?? portfolioItem?.change;
  const changePercent = quote?.regularMarketChangePercent ?? portfolioItem?.changePercent;
  const logourl = quote?.logourl || portfolioItem?.logourl;
  const isPositive = (change ?? 0) >= 0;

  if (!price) {
    return (
      <div className="stock-card loading">
        <div className="stock-ticker">{ticker}</div>
        <div className="stock-price">Carregando...</div>
      </div>
    );
  }

  let totalValue = 0;
  let costBasis = 0;
  let profit = 0;
  let profitPercent = 0;
  let portfolioTotal = 0;

  if (portfolio) {
    for (const [, item] of Object.entries(portfolio)) {
      const p = item?.price;
      if (p) portfolioTotal += (item.quantity || 0) * p;
    }
  }

  if (portfolioItem) {
    const qty = portfolioItem.quantity || 0;
    const purchasePrice = portfolioItem.purchasePrice || 0;
    totalValue = qty * price;
    costBasis = qty * purchasePrice;
    profit = totalValue - costBasis;
    profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;
  }

  const allocation = portfolioTotal > 0 ? (totalValue / portfolioTotal) * 100 : null;

  const mask = (v) => (hideValues ? "••••••" : v);

  return (
    <div className="stock-card" onClick={() => navigate(`/stock/${ticker}`)}>
      <div className="stock-header">
        <span className="stock-ticker">{ticker}</span>
        {logourl && (
          <img src={logourl} alt="" className="stock-logo" />
        )}
      </div>
      <div className="stock-price">R$ {mask(formatNumber(price))}</div>
      {portfolioItem?.priceUsd != null && (
        <div className="stock-price-usd">US$ {mask(formatNumber(portfolioItem.priceUsd))}</div>
      )}
      {change != null && (
        <div className="stock-change-wrap">
          <span className="stock-change-label">Variação do dia</span>
          <span className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
            {hideValues ? "••••••" : `${portfolioItem?.priceUsd != null ? 'US$ ' : 'R$ '}${isPositive ? '+' : ''}${formatNumber(change)} (${isPositive ? '+' : ''}${formatPercent(changePercent)})`}
          </span>
        </div>
      )}
      {portfolioItem?.dividendYield != null && (
        <div className="stock-dividend">
          DY 12m: {mask(formatPercent(portfolioItem.dividendYield))}
        </div>
      )}
      {portfolioItem && (
        <div className="stock-portfolio-info">
          <div className="info-row">
            <span>Qtd:</span>
            <span>{portfolioItem.quantity}</span>
          </div>
          <div className="info-row">
            <span>Total:</span>
            <span>R$ {mask(formatNumber(totalValue))}</span>
          </div>
          {allocation != null && (
            <div className="info-row allocation">
              <span>Carteira:</span>
              <span>{formatPercent(allocation)}</span>
            </div>
          )}
          <div className={`info-row profit ${profit >= 0 ? 'positive' : 'negative'}`}>
            <span>Lucro:</span>
            <span>R$ {mask(formatNumber(profit))} {!hideValues && `(${profitPercent >= 0 ? '+' : ''}${formatPercent(profitPercent)})`}</span>
          </div>
        </div>
      )}
    </div>
  );
}
