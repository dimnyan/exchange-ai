// src/hooks/useBtcPrice.ts
"use client";

import { useEffect, useState, useRef } from "react";

export const useBtcPrice = () => {
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
          { next: { revalidate: 10 } } // ISR fallback
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const btcPrice = data.bitcoin?.usd;

        if (!btcPrice) throw new Error("No price data");

        setPrice(btcPrice);
      } catch (err: any) {
        console.error("CoinGecko Error:", err);
        setError("Failed to load price");
        setPrice(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    intervalRef.current = setInterval(fetchPrice, 10000); // Every 10s

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { price, loading, error };
};