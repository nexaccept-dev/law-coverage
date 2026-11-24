export function percent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function truncate(value: string, max = 120): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
