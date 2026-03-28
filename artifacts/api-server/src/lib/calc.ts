export function calculateEstimateTotals(lineItems: Array<{
  type: string;
  quantity: number;
  unitCost: number;
}>, markupPercent: number, taxPercent: number) {
  const materialsCost = lineItems
    .filter(i => i.type === "material")
    .reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  const laborCost = lineItems
    .filter(i => i.type === "labor")
    .reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  const otherCost = lineItems
    .filter(i => i.type !== "material" && i.type !== "labor")
    .reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  const subtotal = materialsCost + laborCost + otherCost;
  const markupAmount = subtotal * (markupPercent / 100);
  const taxBase = subtotal + markupAmount;
  const taxAmount = taxBase * (taxPercent / 100);
  const total = taxBase + taxAmount;

  // Profit = total revenue - direct costs (materials + subcontractors/other)
  // Labor cost here includes contractor's own labor which is profit
  const directCosts = materialsCost + lineItems
    .filter(i => i.type === "subcontractor" || i.type === "other")
    .reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  const profitMargin = total > 0 ? ((total - directCosts) / total) * 100 : 0;

  return {
    subtotal: round2(subtotal),
    materialsCost: round2(materialsCost),
    laborCost: round2(laborCost),
    markupAmount: round2(markupAmount),
    taxAmount: round2(taxAmount),
    total: round2(total),
    profitMargin: round2(profitMargin),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
