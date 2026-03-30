type CurrencyFormatOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatCurrency(
  amountCents: number,
  currency = "USD",
  options: CurrencyFormatOptions = {}
) {
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amountCents / 100);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(value);
}

export function formatRelativeTime(input: string) {
  const timestamp = new Date(input).getTime();
  const diffSeconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.round(diffHours / 24)}d ago`;
}

export function formatClockTime(input: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(input));
}
