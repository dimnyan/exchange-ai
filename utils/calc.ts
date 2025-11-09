export type PositionSide = "long" | "short";

export const calculateLiquidationPrice = (
  entryPrice: number,
  leverage: number,
  side: PositionSide = "long"
): number => {
  if (entryPrice <= 0 || leverage <= 0) return 0;

  let mmr: number;
  if (leverage <= 10) mmr = 0.004;
  else if (leverage <= 20) mmr = 0.005;
  else if (leverage <= 50) mmr = 0.01;
  else mmr = 0.025;

  const factor = 1 / leverage * mmr;

  return side === "long"
    ? entryPrice * (1 - factor)
    : entryPrice * (1 + factor);
};