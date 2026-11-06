export function formatCost(value: number, unit: string): string {
  const amount = value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const normalizedUnit = unit.trim();
  if (normalizedUnit === "₹ lakh") return `₹ ${amount} lakh`;
  if (normalizedUnit === "₹") return `₹ ${amount}`;
  return `${amount} ${normalizedUnit}`.trim();
}
