// src/app/alerts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ref, onValue, push, set, remove } from "firebase/database";
import { db, auth } from "@/lib/firebase";
import { usePositions } from "@/hooks/usePositions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { safeSpread } from "@/utils/firebase";
import { Card, Table, Button, Modal, Form, InputNumber, Select, Space, Tag, Switch, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const columns = [
  { title: "Type", dataIndex: "type", key: "type", render: (t: string) => <Tag color={t === "liquidation" ? "red" : "blue"}>{t}</Tag> },
  { title: "Threshold", dataIndex: "threshold", key: "threshold" },
  { title: "Linked", dataIndex: "positionId", key: "positionId", render: (id: string, record: any) => record.position?.symbol || "-" },
  {
    title: "Active",
    dataIndex: "active",
    key: "active",
    render: (active: boolean, record: any) => (
      <Switch
        checked={active}
        onChange={(checked) => toggleAlert(record.id, checked)}
      />
    ),
  },
  {
    title: "Action",
    key: "action",
    render: (_: any, record: any) => (
      <Button danger size="small" icon={<DeleteOutlined />} onClick={() => deleteAlert(record.id)} />
    ),
  },
];

let toggleAlert: (id: string, active: boolean) => void;
let deleteAlert: (id: string) => void;

export default function Alerts() {
  const { profile } = useUserProfile();
  const { positions } = usePositions();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!auth.currentUser || !profile) return;
    const alertsRef = ref(db, `users/${auth.currentUser.uid}/alerts`);
    const unsubscribe = onValue(alertsRef, (snap) => {
      const data = snap.val();
      if (!data || typeof data !== "object") {
        setAlerts([]);
        return;
      }
      const list = Object.entries(data).map(([id, val]) => ({
        id,
        ...safeSpread(val),
        position: positions.find((p: any) => p.id === (val as any).positionId),
      }));
      setAlerts(list);
    });
    return unsubscribe;
  }, [profile, positions]);

  toggleAlert = async (id: string, active: boolean) => {
    await set(ref(db, `users/${auth.currentUser!.uid}/alerts/${id}/active`), active);
  };

  deleteAlert = async (id: string) => {
    await remove(ref(db, `users/${auth.currentUser!.uid}/alerts/${id}`));
    message.success("Alert deleted");
  };

  const handleCreate = async (values: any) => {
    const alertsRef = ref(db, `users/${auth.currentUser!.uid}/alerts`);
    const newRef = push(alertsRef);
    await set(newRef, { ...values, active: true, createdAt: Date.now() });
    setOpen(false);
    form.resetFields();
    message.success("Alert created");
  };

  if (!profile) return null;

  return (
    <Card
      title="Alert System"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Add Alert</Button>}
    >
      <Table dataSource={alerts} columns={columns} rowKey="id" />

      <Modal
        title="Create Alert"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="liquidation">Liquidation</Select.Option>
              <Select.Option value="price">Price</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="threshold" label="Threshold" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="positionId" label="Link to Position">
            <Select allowClear>
              {positions.map((p: any) => (
                <Select.Option key={p.id} value={p.id}>{p.symbol}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">Create</Button>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}