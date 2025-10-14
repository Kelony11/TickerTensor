
import { count_peaks, count_troughs } from "./peaks.js";


export const to_number = (x) => {
  const n =
    typeof x === "number"
      ? x
      : parseFloat(String(x).replace(/[$,]/g, "")); // strip $ and , just in case
  return Number.isFinite(n) ? n : NaN;
};

// Arithmetic mean (μ).

export const mean = (values) => {
  const nums = (values ?? []).map(to_number).filter(Number.isFinite);
  const n = nums.length;
  return n === 0 ? NaN : nums.reduce((a, b) => a + b, 0) / n;
};

//  Variance.

export const variance = (values, use_sample = false) => {
  const nums = (values ?? []).map(to_number).filter(Number.isFinite);
  const n = nums.length;
  if (n === 0 || (use_sample && n < 2)) return NaN;

  const m = mean(nums);
  const sum_sq_diff = nums.reduce((acc, v) => acc + (v - m) ** 2, 0);
  return sum_sq_diff / (use_sample ? n - 1 : n);
};

/**
 * Standard deviation (σ) = sqrt(variance).
 * - Matches population vs sample per use_sample flag.
 */

export const standard_deviation = (values, use_sample = false) => {
  const v = variance(values, use_sample);
  return Number.isFinite(v) ? Math.sqrt(v) : NaN;
};


export const windows = (series, window_size, step = 1) => {
  if (
    !Array.isArray(series) ||
    !Number.isInteger(window_size) ||
    !Number.isInteger(step) ||
    window_size < 1 ||
    step < 1
  )
    return [];

  const n = series.length;
  if (n < window_size) return [];

  const count = Math.floor((n - window_size) / step) + 1;
  return Array.from({ length: count }, (_, k) =>
    series.slice(k * step, k * step + window_size)
  );
};


export const stats_per_window = (
  series,
  window_size,
  step = 1,
  use_sample_std = false
) =>
  windows(series, window_size, step).map((w) => ({
    mean: mean(w),
    standard_deviation: standard_deviation(w, use_sample_std),
    peaks: count_peaks(w),
    troughs: count_troughs(w),
    length: w.length,
  }));

/**
 * Range helper: {min, max} for a list of values.
 */

export const range = (values) => {
  const nums = (values ?? []).map(to_number).filter(Number.isFinite);
  return nums.length === 0
    ? { min: NaN, max: NaN }
    : {
        min: nums.reduce((a, b) => (a < b ? a : b)),
        max: nums.reduce((a, b) => (a > b ? a : b)),
      };
};
