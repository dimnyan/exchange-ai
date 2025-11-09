// src/components/AuthHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Layout, Menu, Avatar, Dropdown, Space } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const { Header } = Layout;

const menuItems = [
  { key: "/dashboard", label: <Link href="/dashboard">Dashboard</Link> },
  { key: "/calculators", label: <Link href="/calculators">Calculators</Link> },
  { key: "/alerts", label: <Link href="/alerts">Alerts</Link> },
  { key: "/community", label: <Link href="/community">Community</Link> },
  { key: "/support", label: <Link href="/support">Support</Link> },
];

export default function AuthHeader() {
  const { profile } = useUserProfile();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
      router.refresh(); // Force re-render of server components
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: profile?.name || "User",
        disabled: true,
      },
      { type: "divider" as const },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Sign Out",
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Header style={{ padding: 0, background: "#001529" }}>
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[pathname]}
          items={menuItems}
          style={{ flex: 1, minWidth: 0 }}
        />

        <Space>
          {profile ? (
            <Dropdown menu={userMenu} trigger={["click"]}>
              <Avatar
                style={{ backgroundColor: "#1890ff", cursor: "pointer" }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          ) : (
            <Link href="/dashboard" style={{ color: "#fff" }}>
              Sign In
            </Link>
          )}
        </Space>
      </div>
    </Header>
  );
}