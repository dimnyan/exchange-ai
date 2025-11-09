// src/app/support/page.tsx
"use client";

import { Card, Typography, List, Space } from "antd";
import { MailOutlined, FileTextOutlined, MessageOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Title } = Typography;

const resources = [
  { icon: <FileTextOutlined />, title: "Risk Management Guide", link: "/docs/risk.pdf" },
  { icon: <MailOutlined />, title: "Contact Support", link: "mailto:support@liquidationguard.com" },
  { icon: <MessageOutlined />, title: "Community Forum", link: "/community" },
];

// Move renderItem outside JSX
const renderItem = (item: any) => (
  <List.Item>
    <Space>
      {item.icon}
      <Link href={item.link} target="_blank" rel="noopener noreferrer">
        {item.title}
      </Link>
    </Space>
  </List.Item>
);

export default function Support() {
  return (
    <Card style={{ maxWidth: 600, margin: "0 auto" }}>
      <Title level={2}>Support & Resources</Title>
      <List
        dataSource={resources}
        renderItem={renderItem}
      />
    </Card>
  );
}