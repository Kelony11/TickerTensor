// Imports & ESM setup
import path from "path";
import { read_csv_dir, to_matrix } from "./utils.js";
import { fileURLToPath } from "url";

// Deriving __filename and __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const symbols_map = {
  "ADVANCED MICRO DEVICES": "AMD",
  "ALIBABA": "BABA",
  "AMAZON": "AMZN",
  "APPLE": "AAPL",
  "CISCO": "CSCO",
  "DELL TECHNOLOGIES": "DELL",
  "IBM": "IBM",
  "META": "META",
  "MICROSOFT": "MSFT",
  "NASDAQ": "IXIC",
  "NETFLIX": "NFLX",
  "NVIDIA": "NVDA",
  "ORACLE": "ORCL",
  "PALANTIR": "PLTR",
  "QUALCOMM": "QCOM",
  "SALESFORCE": "CRM",
  "SONY": "SONY",
  "STARBUCKS": "SBUX",
  "TESLA": "TSLA",
  "UBER": "UBER",
};

// Resolve the input folder (CLI arg or default)
const input_folder = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "../data/sample");

try {
  const by_ticker = read_csv_dir(input_folder);
  const { dates, tickers, matrix } = to_matrix(by_ticker);

  if (!Array.isArray(dates) || dates.length === 0) {
    throw new Error(
      "No common dates found across all tickers. Ensure all CSVs share an overlapping range."
    );
  }

  const n = dates.length;
  const m = tickers.length;

  // Use symbols_map for a nicer list
  const pretty_tickers = tickers.map((t) => symbols_map[t] ?? t);

  console.log("Recap:");
  console.log(`Start date: ${dates[0]}`);
  console.log(`End date: ${dates[n - 1]}`);
  console.log(`Number of companies: ${m}`);
  console.log(`Number of points in each time series: ${n}`);
  console.log(`List of tickers: ${pretty_tickers.join(", ")}`);

  // Build a friendly preview with a Date column
  const fmt = (v) =>
    typeof v === "number" && Number.isFinite(v) ? v.toFixed(2) : "NA";

  const to_rows = (indices) =>
    indices.map((i) => {
      const row = { Date: dates[i] };
      tickers.forEach((tk, col) => {
        const key = symbols_map[tk] ?? tk;
        row[key] = fmt(matrix[i][col]);
      });
      return row;
    });

  const head_n = Math.min(3, n);
  const tail_n = Math.min(3, n);
  const head_rows = to_rows([...Array(head_n).keys()]);
  const tail_rows =
    n > head_n ? to_rows([...Array(tail_n).keys()].map((k) => n - tail_n + k)) : [];

  console.log(`\nData preview (first ${head_n} and last ${tail_n} rows):`);
  console.table([...head_rows, ...tail_rows]);
} catch (error) {
  // Slightly clearer error surface
  console.error("[ERROR]", error.message);
  process.exit(1);
}
