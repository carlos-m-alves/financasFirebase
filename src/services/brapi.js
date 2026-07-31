import axios from 'axios';

const token = import.meta.env.VITE_BRAPI_TOKEN;

const api = axios.create({
  baseURL: '/api/v2',
});

export async function fetchQuotes(symbols) {
  const results = await Promise.allSettled(
    symbols.map((s) =>
      api.get('/stocks/quote', { params: { symbols: s, token } })
    )
  );
  results
    .filter((r) => r.status === 'rejected')
    .forEach((r) => console.error('Cotação ignorada:', r.reason?.config?.params?.symbols));
  return results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value.data.results);
}

export async function fetchDividends(symbols) {
  const results = await Promise.allSettled(
    symbols.map((s) =>
      api.get('/stocks/dividends', { params: { symbols: s, range: '12mo', token } })
    )
  );
  results
    .filter((r) => r.status === 'rejected')
    .forEach((r) => console.error('Dividendos ignorados:', r.reason?.config?.params?.symbols));
  return results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value.data.results);
}

export async function fetchFxRate() {
  const response = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL');
  return parseFloat(response.data.USDBRL.bid);
}

export async function fetchHistorical(symbol, range = '1y', interval = '1d') {
  const response = await api.get('/stocks/historical', {
    params: { symbols: symbol, range, interval, token },
  });
  const result = response.data.results?.[0];
  return result?.historicalDataPrice || [];
}

export async function fetchAvailableTickers(query) {
  const response = await api.get('/tickers', {
    params: { search: query, token },
  });
  return response.data?.tickers || [];
}
