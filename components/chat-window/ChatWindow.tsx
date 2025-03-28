"use client";
import React from 'react';
import { useState, useEffect, useRef, useContext } from "react";
import { Message, ChatState } from "./types";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { SocketContext } from "../socket/SocketProvider";

const INITIAL_MESSAGE: Message = {
  id: "initial",
  content: "Hi! 👋 How can I help you today?",
  sender: "bot",
  messageType: "interactive",
  isInteractive: true, // Match backend's messageType
  messageOptions: [],
  role: "assistant",
  sendType: "assistant",
  timestamp: new Date(),
};

export function ChatWindow() {
  const { socket, SocketConnection } = useContext(SocketContext);

  const [isHuman, setIsHuman] = useState(false);

  const defaultChatState: ChatState = {
    messages: [INITIAL_MESSAGE], // Default to initial message
    isTyping: false,
    isOpen: false,
  };
  const [chatState, setChatState] = useState<ChatState>(defaultChatState);

  useEffect(() => {
    // If the socket doesn't exist, initiate the connection
    if (!socket) {
      return;
    }
    const handleMessage = (message: any) => {
      if (message?.isHuman !== undefined) {
        setIsHuman(message.isHuman);
      }

      if (socket) {
        console.log(message, "message on");
        setChatState((prevState) => ({
          ...prevState,
          messages: [
            ...prevState.messages,
            {
              id: message?.latestMessage?.id || uuidv4(),
              content: message?.latestMessage?.content,
              role: message?.latestMessage?.sendType,
              sendType: message?.latestMessage?.sendType,
              timestamp: new Date(message.timestamp || Date.now()),
              agentType: message.agentType,
              attachments: message?.latestMessage?.attachments,
              messageOptions: message?.latestMessage?.messageOptions,
            },
          ],
        }));
      }
    };

    socket.on("message", handleMessage);

    // Emit "get-messages" event with chatId from local storage
    const chatId = localStorage.getItem("chatID");
    if (chatId) {
      socket.emit("get-messages", { chatId }, (messages: any) => {
        if (messages?.messages && messages.messages.length > 0) {
          setChatState({
            messages: messages?.messages
              .map((msg: any) => ({
                id: msg.id || uuidv4(),
                content: msg.content,
                role: msg.sendType,
                sendType: msg.sendType,
                timestamp: new Date(msg.timestamp || Date.now()),
                agentType: msg.agentType,
                messageOptions: msg?.messageOptions,
                attachments: msg.attachments,
              }))
              .reverse(), // Reverse the order of messages here,
            isTyping: false,
            isOpen: false,
          });

          socket.emit("getchatdetails", { chatId }, (msg: any) => {
            console.log("Received message:", msg?.chat?.isHuman);
            if (msg?.chat?.isHuman !== undefined) {
              // console.log("Received isHuman value:", msg.isHuman);
              setIsHuman(msg?.chat?.isHuman);
            }
          });
        } else {
          setChatState({
            messages: [INITIAL_MESSAGE],
            isTyping: false,
            isOpen: false,
          });
        }
      });
    }

    return () => {
      socket.off("message", handleMessage);
    };
  }, [socket, SocketConnection]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentsUrls, setAttachmentsUrls] = useState<any[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatState.messages]);

  const handleSend = async (
    content: string,
    attachments: any[],
    attachmentsUrls: any[]
  ) => {
    if ((!content.trim() && attachments.length === 0) || chatState.isTyping)
      return;

    const userMessageId = uuidv4();

    if (!socket) {
      console.log("Socket is null, initiating connection...");
      return;
    }

    setChatState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          id: userMessageId,
          content,
          role: "user",
          sendType: "user",
          receiverType: "assistant",
          chatId: localStorage.getItem("chatID"),
          sender: localStorage.getItem("userid"),
          timestamp: new Date(),
          // messageOptions: msg?.messageOptions,
          attachments: attachmentsUrls.length > 0 ? [...attachmentsUrls] : [],
        },
      ],
      isTyping: true,
    }));

    if (socket) {
      console.log("Attachments before state update:", attachmentsUrls);
      socket.emit(
        "save-message",
        {
          id: userMessageId,
          content,
          role: "user",
          sendType: "user",
          receiverType: "assistant",
          chatId: localStorage.getItem("chatID"),
          sender: localStorage.getItem("userid"),
          timestamp: new Date(),
          attachments: attachmentsUrls.length > 0 ? [...attachmentsUrls] : [],
        },
        (message: any) => {
          // console.log("callback:-", message);
        }
      );
    } else {
      console.error("Socket is null");
    }

    try {
      const currentFlowState = chatState.messages.find(
        (m) => m.flowState
      )?.flowState;

      if (!isHuman) {
      } else {
        console.error("Socket is null");
      }
      setChatState((state) => ({
        ...state,
        // messages: state.messages.filter((msg) => msg.id !== userMessageId),
        isTyping: false,
      }));
    } catch (error) {
      console.error("Chat error:", error);
      setChatState((state) => ({
        ...state,
        messages: state.messages.filter((msg) => msg.id !== userMessageId),
        isTyping: false,
      }));

      const errorMessage: Message = {
        id: uuidv4(),
        content: "⚠️ Oops! Something went wrong. Please try again.",
        role: "assistant",
        receiver: localStorage.getItem("chatID") || undefined,
        receiverType: "user",
        sendType: "assistant",
        timestamp: new Date(),
      };

      setChatState((state) => ({
        ...state,
        messages: [...state.messages, errorMessage],
      }));
    }
  };

  const handleClearChat = () => {
    setChatState({
      messages: [INITIAL_MESSAGE],
      isTyping: false,
      isOpen: true,
    });
  };

  const handleOptionSelect = (option: { label: string; value: string }) => {
    if (socket) {
      const userMessageId = uuidv4();
      const userMessage: Message = {
        id: Date.now().toString(),
        content: option.label,
        sender: "user",
        role: "user",
        timestamp: new Date(),
      };

      setChatState((prevState) => ({
        ...prevState,
        messages: [...prevState.messages, userMessage],
      }));
      socket.emit(
        "save-message",
        {
          id: userMessageId,
          content: option.label,
          isInteractiveAnswer: true,
          role: "user",
          sendType: "user",
          receiverType: "assistant",
          chatId: localStorage.getItem("chatID"),
          sender: localStorage.getItem("userid"),
          timestamp: new Date(),
          attachments: attachmentsUrls.length > 0 ? [...attachmentsUrls] : [],
        },
        (message: any) => {
          // console.log("callback:-", message);
        }
      );
    } else {
      console.error("Socket is null");
    }
  };

  const isChatOpen = chatState.isOpen;
  useEffect(() => {
    if (isChatOpen) {
      requestAnimationFrame(() => {
        const chatContainer = document.querySelector(
          "div[data-radix-scroll-area-viewport]"
        );
        if (chatContainer) {
          chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    }
  }, [isChatOpen]);

  return (
    <>
      <AnimatePresence>
        {/* {chatState.isOpen && ( */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-24 right-4 w-[380px] max-w-[calc(100vw-2rem)] z-50"
          >
            <Card className="shadow-xl border-none overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-blue-500 text-white">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <h2 className="font-semibold">Chat Support</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearChat}
                    className="hover:bg-blue-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setChatState((s) => ({ ...s, isOpen: false }))
                    }
                    className="hover:bg-blue-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[500px]">
                {chatState.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    handleOptionSelect={handleOptionSelect}
                  />
                ))}
                {chatState.isTyping && (
                  <div className="p-4 flex items-center gap-2 text-muted-foreground">
                    <div className="h-2 w-2 bg-current rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-current rounded-full animate-bounce delay-100" />
                    <div className="h-2 w-2 bg-current rounded-full animate-bounce delay-200" />
                  </div>
                )}
                <div ref={scrollRef} />
              </ScrollArea>

              <ChatInput
                onSend={handleSend}
                isTyping={chatState.isTyping}
                setAttachments={setAttachments}
                attachments={attachments}
                attachmentsUrls={attachmentsUrls}
                setAttachmentsUrls={setAttachmentsUrls}
              />
            </Card>
          </motion.div>
        {/* )} */}
      </AnimatePresence>
    </>
  );
}