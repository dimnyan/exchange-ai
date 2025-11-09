// src/app/dashboard/page.tsx
"use client";

import { useUserProfile } from "@/hooks/useUserProfile";
import { usePositions } from "@/hooks/usePositions";
import { useBtcPrice } from "@/hooks/useBtcPrice"; // ← COINGECKO
import { Card, Table, Typography, Space, Spin, Empty, Button, Statistic, Row, Col, Alert } from "antd";
import { CalculatorOutlined } from "@ant-design/icons";
import Link from "next/link";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

const { Title } = Typography;

const columns = [
  { title: "Symbol", dataIndex: "symbol", key: "symbol" },
  { title: "Entry", dataIndex: "entry", key: "entry", render: (v: number) => `$${v.toFixed(2)}` },
  { title: "Size", dataIndex: "size", key: "size", render: (v: number) => v.toFixed(4) },
  { title: "Leverage", dataIndex: "leverage", key: "leverage", render: (v: number) => `${v}x` },
  {
    title: "Liq. Price",
    dataIndex: "liquidationPrice",
    key: "liquidationPrice",
    render: (v: number) => v ? <span style={{ color: "#ff4d4f" }}>${v.toFixed(2)}</span> : "-",
  },
];

export default function Dashboard() {
  const { profile, loading: profileLoading } = useUserProfile();
  const { positions, loading: positionsLoading } = usePositions();
  const { price: btcPrice, loading: priceLoading, error: priceError } = useBtcPrice();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  if (profileLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Title level={2}>Welcome to Liquidation Guard</Title>
        <Title level={4} type="secondary">
          Sign in to manage positions, alerts, and more.
        </Title>
        <Space direction="vertical" size="middle" style={{ marginTop: 32 }}>
          <Button type="primary" size="large" onClick={handleSignIn}>
            Sign in with Google
          </Button>
          <Link href="/">
            <Button type="link">Back to Home</Button>
          </Link>
        </Space>
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Live BTC Price via CoinGecko */}
      <Row gutter={16}>
        <Col span={12}>
          <Card>
            {priceError ? (
              <Alert message="Price Error" description={priceError} type="error" showIcon />
            ) : (
              <Statistic
                title="BTC/USDT Live Price"
                value={btcPrice}
                precision={2}
                valueStyle={{ color: "#52c41a" }}
                prefix="$"
                loading={priceLoading}
              />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Title level={3}>Risk Profile</Title>
            <p>Default Risk: <strong>{profile.riskPct}%</strong> per trade</p>
          </Card>
        </Col>
      </Row>

      {/* Positions Table */}
      <Card
        title={<Title level={4}>Active Positions</Title>}
        extra={
          <Link href="/calculators">
            <Button type="primary" icon={<CalculatorOutlined />}>
              Add Position
            </Button>
          </Link>
        }
      >
        {positionsLoading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin />
          </div>
        ) : positions.length === 0 ? (
          <Empty description="No positions yet" />
        ) : (
          <Table dataSource={positions} columns={columns} rowKey="id" pagination={false} />
        )}
      </Card>
    </Space>
  );
}