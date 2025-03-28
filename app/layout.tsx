import type { Metadata } from "next";
import React from 'react';
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ChatWidget } from "@/components/chat/ChatWidget";
import SocketProvider from "@/components/socket/SocketProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI CHAT BOT",
  description: "AI CHAT BOT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="system">
      <body className={inter.className}>
        <SocketProvider>
          {children}
          {/* <ChatWidget /> */}
          <Toaster />
        </SocketProvider>
      </body>
    </html>
  );
}
