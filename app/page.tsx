"use client";
import { Bot } from "lucide-react";
import React from 'react';
export default function Home() {
  return (
    <main className="container mx-auto p-4 min-h-screen">
      <div className="flex flex-col items-center justify-center space-y-8 py-8">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6" />
          <h1 className="text-2xl font-bold">AI Bot</h1>
        </div>
      </div>
    </main>
  );
}
