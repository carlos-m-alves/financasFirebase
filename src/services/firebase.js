import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, remove, update } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBSuK4nHzo62gxnSPzvPPwYIAkPxgShfs8",
  authDomain: "financasfirebase.firebaseapp.com",
  databaseURL: "https://financasfirebase-default-rtdb.firebaseio.com",
  projectId: "financasfirebase",
  storageBucket: "financasfirebase.firebasestorage.app",
  messagingSenderId: "989660988316",
  appId: "1:989660988316:web:f1605a595fd84e28613e59",
  measurementId: "G-YS31R2B3ML"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

const STOCKS_PATH = "stocks";

export async function getAllStocks() {
  const snap = await get(ref(db, STOCKS_PATH));
  return snap.val() || {};
}

export async function getStockHistory(ticker) {
  const snap = await get(ref(db, `history/${ticker}`));
  return snap.val() || {};
}

export async function saveStock(ticker, data) {
  await set(ref(db, `${STOCKS_PATH}/${ticker}`), data);
}

export async function removeStock(ticker) {
  await remove(ref(db, `${STOCKS_PATH}/${ticker}`));
}

export async function saveStockPrices(prices, dividendYields = {}, fxRate = null) {
  const now = new Date().toISOString();
  for (const [ticker, data] of Object.entries(prices)) {
    const isUsd = data.currency === 'USD';
    await update(ref(db, `${STOCKS_PATH}/${ticker}`), {
      price: isUsd && fxRate ? data.regularMarketPrice * fxRate : data.regularMarketPrice,
      priceUsd: isUsd ? data.regularMarketPrice : null,
      change: data.regularMarketChange,
      changePercent: data.regularMarketChangePercent,
      dividendYield: dividendYields[ticker] ?? null,
      currency: data.currency || 'BRL',
      fxRate: isUsd ? fxRate : null,
      updatedAt: now,
    });
  }
}
