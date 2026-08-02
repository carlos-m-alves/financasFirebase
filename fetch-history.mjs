import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";
import { readFileSync } from "node:fs";

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
const db = getDatabase(app);

function loadTokenFromEnv() {
  const raw = readFileSync(".env", "utf8");
  const line = raw
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("VITE_BRAPI_TOKEN="));
  return line ? line.slice("VITE_BRAPI_TOKEN=".length).trim() : "";
}

const TOKEN = loadTokenFromEnv();
const BR_RANGE = "1y";
const US_RANGE = "3mo";

function getRanges(currency) {
  return currency === "USD" ? ["3mo"] : ["1y", "3mo"];
}

async function fetchHistory(symbol, range) {
  const url = `https://brapi.dev/api/v2/stocks/historical?symbols=${encodeURIComponent(symbol)}&range=${range}&interval=1d&token=${TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.results?.[0]?.data?.historicalDataPrice || [];
}

const snap = await get(ref(db, "stocks"));
const stocks = snap.val() || {};
const tickers = Object.keys(stocks);

let ok = 0;
let fail = 0;

for (const ticker of tickers) {
  const ranges = getRanges(stocks[ticker]?.currency);
  let entries = null;
  let usedRange = null;
  for (const range of ranges) {
    try {
      entries = await fetchHistory(ticker, range);
      usedRange = range;
      break;
    } catch (err) {
      console.log(`   ${ticker} ${range} indisponível (${err.message})`);
    }
  }
  if (!entries) {
    console.log(`FAIL ${ticker}: nenhum range disponível`);
    fail++;
    continue;
  }
  try {
    const byDate = {};
    for (const d of entries) {
      byDate[new Date(d.date * 1000).toISOString().slice(0, 10)] = {
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
        adjustedClose: d.adjustedClose,
      };
    }
    await update(ref(db, `history/${ticker}`), byDate);
    console.log(`OK   ${ticker} (${usedRange}): ${entries.length} dias`);
    ok++;
  } catch (err) {
    console.log(`FAIL ${ticker}: ${err.message}`);
    fail++;
  }
}

console.log(`\n${ok} ok, ${fail} falhas`);
process.exit(0);
