// strict local extrema; endpoints ignored; no loops

// Return interior indices [1..n-2] that satisfy predicate(i)
const interior_matches = (values, predicate) =>
  (values?.length ?? 0) < 3
    ? []
    : Array.from({ length: values.length - 2 }, (_, k) => k + 1).filter(predicate);

// Indices of strict local maxima/minima
export const peak_indices = (values) =>
  interior_matches(values, (i) => values[i] > values[i - 1] && values[i] > values[i + 1]);

export const trough_indices = (values) =>
  interior_matches(values, (i) => values[i] < values[i - 1] && values[i] < values[i + 1]);

// Snake_case counters (as in your “Original code”)
export const count_peaks = (values) => peak_indices(values).length;
export const count_troughs = (values) => trough_indices(values).length;

// CamelCase aliases (used in earlier snippets/specs)
export const countPeaks = count_peaks;
export const countTroughs = count_troughs;

