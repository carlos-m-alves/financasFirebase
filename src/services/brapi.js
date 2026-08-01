import axios from 'axios';

const token = import.meta.env.VITE_BRAPI_TOKEN;

const api = axios.create({
  baseURL: '/api/v2',
});

let dividendsUnavailable = false;

export async function fetchQuotes(symbols) {
  const results = await Promise.allSettled(
    symbols.map((s) =>
      api.get('/stocks/quote', { params: { symbols: s, token } })
    )
  );
  const ignored = results
    .filter((r) => r.status === 'rejected')
    .map((r) => r.reason?.config?.params?.symbols)
    .filter(Boolean);
  if (ignored.length) {
    console.warn('Brapi: cotações não encontradas (ticker inválido?):', ignored.join(', '));
  }
  return results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value.data.results);
}

export async function fetchDividends(symbols) {
  if (dividendsUnavailable || !symbols?.length) return [];

  const results = await Promise.allSettled(
    symbols.map((s) =>
      api.get('/stocks/dividends', { params: { symbols: s, range: '12mo', token } })
    )
  );

  const rejected = results.filter((r) => r.status === 'rejected');
  const blocked = rejected.some(
    (r) => r.reason?.response?.status === 403 && r.reason?.response?.data?.code === 'FEATURE_NOT_AVAILABLE'
  );
  if (blocked) {
    dividendsUnavailable = true;
    console.warn('Brapi: o plano atual não tem acesso a dividendos (brapi.dev/dashboard). Busca desativada.');
  } else if (rejected.length) {
    console.warn(
      'Brapi: dividendos não retornados para:',
      rejected.map((r) => r.reason?.config?.params?.symbols).filter(Boolean).join(', ')
    );
  }

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
