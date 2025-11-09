// src/components/ClientLayout.tsx
"use client";

import AuthHeader from "@/components/AuthHeader";
import { Layout } from "antd";

const { Content } = Layout;

export default function ClientLayout({
                                       children,
                                     }: {
  children: React.ReactNode;
}) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AuthHeader />
      <Content style={{ padding: "24px", background: "#f9fafb" }}>
        {children}
      </Content>
    </Layout>
  );
}