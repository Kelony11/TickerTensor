# TickerTensor
**Multi-Ticker CSV Ingestion → Aligned N×M Price Matrix + Moving-Window Stats**

# PROJECT OVERVIEW
TickerTensor is a small, production-friendly Node.js tool that ingests multiple equity CSVs and converts them into a clean, chronologically aligned N×M matrix of closing prices—great for quant research and backtests.
It includes a functional, loop-free moving-window statistics (mean, standard deviation, peak/trough counts) over overlapping and non-overlapping windows and prints concise summaries.

# KEY FEATURES 🔑
* **Robust CSV ingestion.**
  - Handles comma/semicolon/tab delimiters, header aliases (Close/Last, Adj Close, etc.), $ and thousands separators, and date normalization to ISO (YYYY-MM-DD).
* **Deterministic alignment**
  - Intersects trading dates across all tickers to produce a rectangular N×M matrix (rows = dates, columns = tickers).
* **Fast assembly (O(N×M))**
  - Uses per-ticker Map(date → close) for O(1) lookups while building the matrix.
* **Moving-window statistics**
  - Functional JS (only map, reduce, filter, slice, Array.from; no for/while).
  - Computes mean, standard deviation (population by default; sample optional), and strict local peaks/troughs (endpoints ignored).
  - Overlapping windows (step = 1 or 5) and non-overlapping (step = window size).
  - Window sizes: 50, 200, 2000 (or custom via CLI for small samples).
* **Readable CLI output**
  - Prints a concise recap (start/end dates, companies, points per series) and a formatted table preview (first/last rows).


# TECHNICAL STACK 🧱

- Language/Runtime: JavaScript (ESM), Node.js

- Core Modules: fs, path, url

- Testing: Jasmine 5

- Tooling: ESLint (flat config), VS Code, Git/GitHub
  

# ROBUSTNESS & EDGE CASES

- Delimiters: comma / semicolon / tab

- Headers: Close, Adj Close, Close/Last, Adjusted Close, Last

- Prices: strip $ and , safely before Number()

- Dates: handle YYYY-MM-DD, M/D/YYYY, and other JS-parsable formats → ISO


# TESTING STRATEGY 🧪

**Run with npm test.**

**Highlights (Jasmine):**

- Matrix shape checks: matrix.length === dates.length, each row matches tickers.length

- Date ordering: every dates[i] >= dates[i-1].

- Real-data sanity test (if data/real available): non-empty intersection and rectangularity.


# PERFORMANCE NOTES 🗒️

- Avoids quadratic .find lookups by pre-building Map(date → close) per ticker.

- Memory footprint tied to dataset size; parsing filters invalid rows early.

- Deterministic sorting ensures repeatable results.


# DATA & PRIVACY ⚙️

- Ship small sample CSVs only.

- Keep large/third-party datasets local: add data/real/ to .gitignore.

- No external network calls; everything runs on local CSV files.


# Contributors 
- Kelvin Ihezue

