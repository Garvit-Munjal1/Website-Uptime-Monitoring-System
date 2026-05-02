export function addTrendLine(data, valueKey, trendKey = 'trendLine') {
  if (!Array.isArray(data) || data.length === 0) return [];

  const points = data
    .map((entry, index) => ({ index, value: Number(entry[valueKey]) }))
    .filter((point) => Number.isFinite(point.value));

  if (points.length === 0) {
    return data.map((entry) => ({ ...entry, [trendKey]: 0 }));
  }

  if (points.length === 1) {
    return data.map((entry) => ({ ...entry, [trendKey]: points[0].value }));
  }

  const n = points.length;
  const sumX = points.reduce((acc, point) => acc + point.index, 0);
  const sumY = points.reduce((acc, point) => acc + point.value, 0);
  const sumXY = points.reduce((acc, point) => acc + point.index * point.value, 0);
  const sumXX = points.reduce((acc, point) => acc + point.index * point.index, 0);

  const denominator = (n * sumXX) - (sumX * sumX);
  const slope = denominator === 0 ? 0 : ((n * sumXY) - (sumX * sumY)) / denominator;
  const intercept = (sumY - (slope * sumX)) / n;

  return data.map((entry, index) => ({
    ...entry,
    [trendKey]: Number((intercept + (slope * index)).toFixed(2))
  }));
}
