/**
 * Formats a numeric price into Indian Rupees (INR) with Indian digit grouping
 * e.g., 150000 -> ₹1,50,000
 */
export function formatINR(amount: number): string {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  })
  return formatter.format(amount)
}
