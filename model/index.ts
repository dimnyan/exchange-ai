import {useState} from "react";

export interface APIResponse<T> {
  data: T | null;
  status: number;
  message: string;
}

export type Position = {
  id: string;
  symbol: string;
  entry: number;
  size: number;
  leverage: number;
  stopLoss?: number;
  liquidationPrice?: number;
  exchange: string;
};


export type UserProfile = {
  email: string;
  name: string;
  riskPct: number;
  createdAt: number;
  accountBalance: number;
};