// src/app/community/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { db, auth } from "@/lib/firebase";
import { useUserProfile } from "@/hooks/useUserProfile";
import { safeSpread } from "@/utils/firebase";
import { Card, List, Avatar, Input, Button, Space, Typography, message } from "antd";
import { SendOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Title } = Typography;

export default function Community() {
  const { profile } = useUserProfile();
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!profile) return;
    const postsRef = ref(db, "communityPosts");
    const unsubscribe = onValue(postsRef, (snap) => {
      const data = snap.val();
      if (!data || typeof data !== "object") {
        setPosts([]);
        return;
      }
      const list = Object.entries(data)
        .map(([id, val]) => ({ id, ...safeSpread(val) }))
        .sort((a: any, b: any) => b.createdAt - a.createdAt);
      setPosts(list);
    });
    return unsubscribe;
  }, [profile]);

  const submitPost = async () => {
    if (!content.trim()) return;
    const postsRef = ref(db, "communityPosts");
    const newRef = push(postsRef);
    await set(newRef, {
      content: content.trim(),
      author: profile?.name,
      uid: auth.currentUser!.uid,
      createdAt: Date.now(),
    });
    setContent("");
    message.success("Posted!");
  };

  if (!profile) return null;

  return (
    <Card style={{ maxWidth: 800, margin: "0 auto" }}>
      <Title level={3}>Community Forum</Title>
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={submitPost} disabled={!content.trim()}>
          Post
        </Button>
      </Space>

      <List
        itemLayout="horizontal"
        dataSource={posts}
        renderItem={(item: any) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar>{item.author[0]}</Avatar>}
              title={<span>{item.author} • {new Date(item.createdAt).toLocaleString()}</span>}
              description={item.content}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}