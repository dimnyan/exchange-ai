// functions/price.ts
export const fetchPrice = async (symbol: string): Promise<number> => {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
  const data = await res.json();
  return parseFloat(data.price);
};