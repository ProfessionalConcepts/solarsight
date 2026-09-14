/**
 * Formats a monetary amount in Kenyan Shillings.
 * Example: formatKsh(480000) => 'KSh 480,000'
 */
export function formatKsh(amount: number): string {
  return `KSh ${Math.round(amount).toLocaleString('en-KE')}`
}

/**
 * Formats kilowatt-hours with comma-thousands and unit.
 * Example: formatKwh(4860) => '4,860 kWh'
 */
export function formatKwh(kwh: number): string {
  return `${Math.round(kwh).toLocaleString('en-KE')} kWh`
}

/**
 * Formats kilowatt-peak to one decimal place with unit.
 * Example: formatKwp(3.0) => '3.0 kWp'
 */
export function formatKwp(kwp: number): string {
  return `${kwp.toFixed(1)} kWp`
}

/**
 * Formats a payback period in years to one decimal place.
 * Example: formatYears(7.5) => '7.5 years'
 */
export function formatYears(years: number): string {
  return `${years.toFixed(1)} years`
}

/**
 * Formats a percentage (0–100 or 0–1 scale, auto-detected).
 * Example: formatPct(99) => '99%' or formatPct(0.99) => '99%'
 */
export function formatPct(pct: number): string {
  const value = pct > 1 ? pct : pct * 100
  return `${Math.round(value)}%`
}
