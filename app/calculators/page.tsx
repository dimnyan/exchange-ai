// src/app/calculators/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { savePosition } from "@/utils/positions";
import {Card, Form, InputNumber, Input, Button, Typography, Alert, Space, message, Switch, Select} from "antd";
import { SaveOutlined, LoginOutlined } from "@ant-design/icons";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {calculateLiquidationPrice} from "@/utils/calc";

const { Title } = Typography;

export default function Calculators() {
  const { profile } = useUserProfile();
  const router = useRouter();
  const [form] = Form.useForm();
  const [result, setResult] = useState<any>(null);
  const [useRiskPct, setUseRiskPct] = useState(false);

  const onFinish = async (values: any) => {
    const { accountBalance, riskPct, amountEntered, symbol, entryPrice, leverage, stopLoss } = values;

    let positionUsd: number;
    let riskUsd: number | null = null;

    if (useRiskPct) {
      // Risk-based sizing
      riskUsd = accountBalance * (riskPct / 100);
      const priceDiff = stopLoss ? Math.abs(entryPrice - stopLoss) : null;
      positionUsd = priceDiff ? riskUsd / (priceDiff / entryPrice) : riskUsd;
    } else {
      // Amount-based sizing
      positionUsd = amountEntered;
    }

    const positionCoin = positionUsd / entryPrice;
    const liquidationPrice = calculateLiquidationPrice(entryPrice, leverage, values.side);

    const calculated = {
      symbol,
      entry: entryPrice,
      leverage,
      stopLoss: stopLoss || null,
      liquidationPrice,
      amountEntered: useRiskPct ? null : amountEntered,
      riskUsd: useRiskPct ? riskUsd : null,
      positionUsd,
      positionCoin,
      exchange: "binance",
    };

    setResult(calculated);

    if (profile) {
      try {
        const id = await savePosition(calculated);
        message.success("Position saved!");
        router.push(`/dashboard?newPosition=${id}`);
      } catch (err) {
        message.error("Failed to save.");
      }
    }
  };

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <Card style={{ maxWidth: 800, margin: "0 auto" }}>
      <Title level={2}>Position Sizing Calculator</Title>
      <Title level={5} type="secondary">
        Enter your trade details. Use **Risk %** or **Amount Entered**.
      </Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          // accountBalance: 10000,
          riskPct: profile?.riskPct || 1,
          // amountEntered: 1000,
          symbol: "BTCUSDT",
          // entryPrice: 60000,
          leverage: 10,
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>

          {/* Toggle Mode */}
          <Space>
            <span>Use Risk %</span>
            <Switch checked={useRiskPct} onChange={setUseRiskPct} />
          </Space>

          {/* Account Balance */}
          <Form.Item
            label="Account Balance (USD)"
            name="accountBalance"
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber
              min={0.01}
              precision={2}
              style={{ width: "100%" }}
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, "") || "0") || 0}
            />
          </Form.Item>

          {/* Risk % (only if enabled) */}
          {useRiskPct && (
            <Form.Item
              label={`Risk % per Trade (default: ${profile?.riskPct || 1}%)`}
              name="riskPct"
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber min={0.1} max={100} step={0.1} style={{ width: "100%" }} />
            </Form.Item>
          )}

          {/* Amount Entered (only if not risk-based) */}
          {!useRiskPct && (
            <Form.Item label="Amount Entered (USD)" name="amountEntered" rules={[{ required: true }]}>
              <InputNumber
                min={0.01}
                precision={2}
                style={{ width: "100%" }}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, "") || "0") || 0}
              />
            </Form.Item>
          )}

          {/* Symbol */}
          <Form.Item label="Symbol" name="symbol" rules={[{ required: true }]}>
            <Input placeholder="e.g., BTCUSDT" />
          </Form.Item>

          {/* Entry Price */}
          <Form.Item label="Entry Price (USD)" name="entryPrice" rules={[{ required: true }]}>
            <InputNumber
              min={0.01}
              precision={2}
              style={{ width: "100%" }}
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, "") || "0") || 0}
            />
          </Form.Item>

          {/* Leverage */}
          <Form.Item
            label="Leverage (x)"
            name="leverage"
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber min={1} max={125} step={1} style={{ width: "100%" }} />
          </Form.Item>

          {/* Stop Loss (Optional) */}
            <Form.Item label="Stop Loss (USD) — Optional" name="stopLoss">
              <InputNumber
                min={0.0001}
                precision={2}
                style={{ width: "100%" }}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, "") || "0") || 0}
              />
            </Form.Item>

          {/* Add side selection */}
          <Form.Item label="Position Side" name="side" initialValue="long">
            <Select>
              <Select.Option value="long">Long</Select.Option>
              <Select.Option value="short">Short</Select.Option>
            </Select>
          </Form.Item>

          {/* Buttons */}
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Calculate
            </Button>

            {!profile && result && (
              <Button icon={<LoginOutlined />} onClick={handleSignIn}>
                Sign In to Save
              </Button>
            )}
          </Space>
        </Space>
      </Form>

      {/* Result */}
      {result && (
        <Alert
          style={{ marginTop: 24 }}
          message="Calculated Position"
          description={
            <div>
              {useRiskPct ? (
                <>
                  <p><strong>Risk Amount:</strong> ${result.riskUsd?.toFixed(2)}</p>
                </>
              ) : (
                <p><strong>Amount Entered:</strong> ${result.amountEntered?.toFixed(2)}</p>
              )}
              <p><strong>Position Value:</strong> ${result.positionUsd.toFixed(2)}</p>
              <p><strong>Position Size:</strong> {result.positionCoin.toFixed(6)} {result.symbol.split("USDT")[0]}</p>
              <p><strong>Liquidation Price:</strong> ${result.liquidationPrice.toFixed(2)}</p>
              {profile ? (
                <p style={{ color: "green", marginTop: 8 }}>Saved to dashboard!</p>
              ) : (
                <p>Sign in to save this position.</p>
              )}
            </div>
          }
          type="success"
          showIcon
        />
      )}
    </Card>
  );
}