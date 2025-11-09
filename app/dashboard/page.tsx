// src/app/dashboard/page.tsx
"use client";
import { useState } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePositions } from "@/hooks/usePositions";
import { useBtcPrice } from "@/hooks/useBtcPrice";
import {
  Card,
  Table,
  Typography,
  Space,
  Spin,
  Empty,
  Button,
  Statistic,
  Row,
  Col,
  Alert,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
  Popconfirm,
  Switch
} from "antd";
import { CalculatorOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import Link from "next/link";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { ref, update, remove } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import {calculateLiquidationPrice} from "@/utils/calc";
import {useEthPrice} from "@/hooks/useEthPrice";

const { Title } = Typography;

export default function Dashboard() {
  const { profile, loading: profileLoading } = useUserProfile();
  const { positions, loading: positionsLoading } = usePositions();
  const { price: btcPrice, loading: btcPriceLoading, error: btcPriceError } = useBtcPrice();
  const { price: ethPrice, loading: ethPriceLoading, error: ethPriceError } = useEthPrice();

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [editForm] = Form.useForm();
  const [useRiskPct, setUseRiskPct] = useState(false);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const showEditModal = (position: any) => {
    const isRiskBased = position.riskUsd != null;  // ← CORRECT
    setUseRiskPct(isRiskBased);
    setEditingPosition(position);

    editForm.setFieldsValue({
      accountBalance: profile?.accountBalance || 10000,
      riskPct: profile?.riskPct || 1,
      amountEntered: position.amountEntered || 1000,
      symbol: position.symbol,
      entryPrice: position.entry,
      leverage: position.leverage,
      stopLoss: position.stopLoss || undefined,
    });

    setEditModalVisible(true);
  };

  // Recalculate & Update
  const handleEditOk = async () => {
    if (!auth.currentUser || !editingPosition) return;

    try {
      const values = await editForm.validateFields();
      const { accountBalance, riskPct, amountEntered, symbol, entryPrice, leverage, stopLoss } = values;

      let positionUsd: number;
      let riskUsd: number | null = null;

      if (useRiskPct) {
        riskUsd = accountBalance * (riskPct / 100);
        const priceDiff = stopLoss ? Math.abs(entryPrice - stopLoss) : null;
        positionUsd = priceDiff ? riskUsd / (priceDiff / entryPrice) : riskUsd;
      } else {
        positionUsd = amountEntered;
      }

      const positionCoin = positionUsd / entryPrice;
      const liquidationPrice = calculateLiquidationPrice(entryPrice, leverage, values.side);

      const updatedData = {
        symbol,
        entry: entryPrice,
        size: positionCoin,
        leverage,
        stopLoss: stopLoss || null,
        liquidationPrice,
        amountEntered: useRiskPct ? null : amountEntered,
        riskUsd: useRiskPct ? riskUsd : null,
        positionUsd,
        exchange: "binance",
        updatedAt: Date.now(),
      };

      await update(ref(db, `users/${auth.currentUser.uid}/positions/${editingPosition.id}`), updatedData);

      message.success("Position updated!");
      setEditModalVisible(false);
      editForm.resetFields();
      setEditingPosition(null);
    } catch (err: any) {
      if (err.errorFields) return;
      message.error("Failed to update.");
    }
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    editForm.resetFields();
    setEditingPosition(null);
    setUseRiskPct(false);
  };

  const deletePosition = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await remove(ref(db, `users/${auth.currentUser.uid}/positions/${id}`));
      message.success("Position deleted.");
    } catch (err) {
      message.error("Failed to delete.");
    }
  };

  const columns = [
    { title: "Symbol", dataIndex: "symbol", key: "symbol" },
    { title: "Entry", dataIndex: "entry", key: "entry", render: (v: number) => `$${v.toLocaleString()}` },
    { title: "Size", dataIndex: "size", key: "size", render: (v: number) => `${v.toLocaleString()}` },
    { title: "Leverage", dataIndex: "leverage", key: "leverage", render: (v: number) => `${v}x` },
    {
      title: "Position Value",
      dataIndex: "positionUsd",
      key: "positionUsd",
      render: (v: number) => v ? `$${v.toLocaleString()}` : "-",
    },
    {
      title: "Risk",
      dataIndex: "riskUsd",
      key: "riskUsd",
      render: (v: number) => v ? `$${v.toLocaleString()}` : "-",
    },
    {
      title: "Liq. Price",
      dataIndex: "liquidationPrice",
      key: "liquidationPrice",
      render: (v: number) => <span style={{ color: "#ff4d4f" }}>${v ? v.toLocaleString() : "-"}</span>,
    },
    {
      title: "Distance to Liq.",
      key: "distance",
      render: (_:any, record:any) => {
        const current = btcPrice || 0;
        const liq = record.liquidationPrice || 0;
        if (!current || !liq) return "-";

        const diff = record.side === "long"
          ? current - liq
          : liq - current;

        const pct = (diff / current) * 100;

        return (
          <span style={{ color: pct > 5 ? "green" : pct > 2 ? "orange" : "red" }}>
        {pct > 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`}
      </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete Position"
            description="Are you sure?"
            onConfirm={() => deletePosition(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
    <>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              {btcPriceError ? (
                <Alert message="BTC Price Error" description={btcPriceError} type="error" showIcon />
              ) : (
                <Statistic
                  title="BTC/USDT Live Price"
                  value={btcPrice}
                  precision={2}
                  // valueStyle={{ color: "#52c41a" }}
                  prefix="$"
                  loading={btcPriceLoading}
                />
              )}
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              {ethPriceError ? (
                <Alert message="ETH Price Error" description={ethPriceError} type="error" showIcon />
              ) : (
                <Statistic
                  title="ETH/USDT Live Price"
                  value={ethPrice}
                  precision={2}
                  // valueStyle={{ color: "#52c41a" }}
                  prefix="$"
                  loading={ethPriceLoading}
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

      {/* Full Edit Modal */}
      <Modal
        title="Edit Position"
        open={editModalVisible}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
        okText="Update"
        cancelText="Cancel"
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Space>
              <span>Use Risk %</span>
              <Switch checked={useRiskPct} onChange={setUseRiskPct} />
            </Space>

            <Form.Item label="Account Balance (USD)" name="accountBalance" rules={[{ required: true }]}>
              <InputNumber
                min={0.01}
                precision={2}
                style={{ width: "100%" }}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, "") || "0") || 0}
              />
            </Form.Item>

            {useRiskPct && (
              <Form.Item label={`Risk %`} name="riskPct" rules={[{ required: true }]}>
                <InputNumber min={0.1} max={100} step={0.1} style={{ width: "100%" }} />
              </Form.Item>
            )}

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

            <Form.Item label="Symbol" name="symbol" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item label="Entry Price" name="entryPrice" rules={[{ required: true }]}>
              <InputNumber
                min={0.01}
                precision={2}
                style={{ width: "100%" }}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => parseFloat(value?.replace(/\$\s?|(,*)/g, "") || "0") || 0}
              />
            </Form.Item>

            <Form.Item label="Leverage (x)" name="leverage" rules={[{ required: true }]}>
              <InputNumber min={1} max={125} step={1} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Stop Loss (USD) — Optional" name="stopLoss">
              <InputNumber min={0.0001} precision={6} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
}