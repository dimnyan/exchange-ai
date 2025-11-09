import React from 'react';
import Link from "next/link";
import { Button, Typography } from "antd";


const HomeComponent = () => {
  // const { Text, Title } = Typography;
  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <div>Liquidation Guard</div>
      <div>Protect Your Trades</div>
      <Link href="/dashboard">
        <Button type="primary" size="large">
          Get Started
        </Button>
      </Link>
    </div>)
};

export default HomeComponent;