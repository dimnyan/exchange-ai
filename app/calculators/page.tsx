// src/app/calculators/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { savePosition } from "@/utils/positions";
import { Card, Form, InputNumber, Input, Button, Typography, Alert, Space, Divider } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import {push, ref, set} from "firebase/database";
import {auth, db} from "@/lib/firebase";

const { Title } = Typography;

export default function Calculators() {
  const { profile } = useUserProfile();
  const router = useRouter();
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    const { accountBalance, riskPct, entryPrice, stopLoss, takeProfit, leverage, symbol } = values;
    const riskAmount = accountBalance * (riskPct / 100);
    const priceDiff = Math.abs(entryPrice - stopLoss);
    const positionSize = riskAmount / priceDiff;
    const liquidationPrice = entryPrice * (1 - (1 / leverage) * 0.005);

    const position = {
      symbol,
      entry: entryPrice,
      size: positionSize,
      leverage,
      stopLoss,
      liquidationPrice,
      exchange: "binance",
    };

    const id = await savePosition(position);
    // Auto-create liquidation alert
    const alertsRef = ref(db, `users/${auth.currentUser!.uid}/alerts`);
    const newAlertRef = push(alertsRef);
    await set(newAlertRef, {
      type: "liquidation",
      threshold: liquidationPrice * 1.01, // 1% buffer
      active: true,
      positionId: id,
      createdAt: Date.now(),
    });
    router.push(`/dashboard?newPosition=${id}`);
  };

  if (!profile) return <Alert message="Please sign in" type="warning" />;

  return (
    <Card style={{ maxWidth: 800, margin: "0 auto" }}>
      <Title level={2}>Position Sizing Calculator</Title>
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ riskPct: profile.riskPct }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Form.Item label="Account Balance ($)" name="accountBalance" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label={`Risk % (default: ${profile.riskPct}%)`} name="riskPct" rules={[{ required: true }]}>
            <InputNumber min={0.1} max={10} step={0.1} style={{ width: "100%" }} />
          </Form.Item>
          <Divider />
          <Form.Item label="Symbol" name="symbol" rules={[{ required: true }]}>
            <Input placeholder="BTCUSD" />
          </Form.Item>
          <Form.Item label="Entry Price" name="entryPrice" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Stop Loss" name="stopLoss" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Take Profit" name="takeProfit">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Leverage (x)" name="leverage" rules={[{ required: true }]}>
            <InputNumber min={1} max={125} step={1} style={{ width: "100%" }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
            Calculate & Save
          </Button>
        </Space>
      </Form>
    </Card>
  );
}