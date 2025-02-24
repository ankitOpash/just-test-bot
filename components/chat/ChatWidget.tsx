"use client";
import { useState, useEffect, useRef, useMemo, useContext } from "react";
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
import axios from "axios";

const INITIAL_MESSAGE: Message = {
  id: "initial",
  content: "Hi! 👋 How can I help you today?",
  role: "assistant",
  sendType: "assistant",
  timestamp: new Date(),
};

export function ChatWidget() {
  const { socket } = useContext(SocketContext);

  // useEffect(() => {
  //   const fetchChatHistory = async () => {
  //     try {
  //       const res = await fetch(`/api/chat?userid=${userid}`);
  //       if (res.ok) {
  //         const data = await res.json();
  //         setMessages(data.messages);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching chat history:", error);
  //     }
  //   };
  //   fetchChatHistory();
  // }, [userid]);

  const initialChatState: ChatState = {
    messages: [INITIAL_MESSAGE], // Default to initial message
    isTyping: false,
    isOpen: false,
  };

  const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [isHuman, setIsHuman] = useState(false);
  // console.log("System Timezone:", systemTimeZone);

  // Get system time in the system's timezone
  const systemTime = new Date();
  const formattedTime = systemTime.toLocaleTimeString("en-US", {
    hour12: false,
  });
  // console.log("System Time:", formattedTime);

  useEffect(() => {
    // Emit "get-messages" event with chatId from local storage
    const chatId = localStorage.getItem("chatID");
    if (socket && chatId) {
      socket.emit("get-messages", { chatId }, (messages: any) => {
        // console.log("message ayyy",messages);

        if (messages?.messages && messages.messages.length > 0) {
          setChatState({
            messages: messages?.messages.map((msg: any) => ({
              id: msg.id || uuidv4(),
              content: msg.content,
              role: msg.sendType,
              sendType: msg.sendType,
              timestamp: new Date(msg.timestamp || Date.now()),
              agentType: msg.agentType,
              attachments: msg.attachments,
            })),
            isTyping: false,
            isOpen: false,
          });
        } else {
          // If no messages, set the initial message
          socket.emit("save-message", {
            id: uuidv4(),
            content: "Hi! 👋 How can I help you today?",
            role: "assistant",
            receiver: localStorage.getItem("chatID") || undefined,
            receiverType: "user",
            sendType: "assistant",
            chatId: localStorage.getItem("chatID"),
            timestamp: new Date(),
            agentType: "General Insurance",
            attachments: [],
          });
          setChatState({
            messages: [INITIAL_MESSAGE],
            isTyping: false,
            isOpen: false,
          });
        }
      });
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on("message", (message) => {
        //console.log(message, "message on");
        if (message?.isHuman !== undefined) {
          setIsHuman(message?.isHuman);
        }

        if (message?.latestMessage?.sendType === "admin") {
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
              },
            ],
          }));
        }
      });

      // Clean up the effect
      return () => {
        socket.off("message");
      };
    }
  }, [socket]);

 
  // const initialChatState = useMemo(() => {
  //   if (typeof window !== "undefined") {
  //     const savedChat = localStorage.getItem("chatHistory");
  //     if (savedChat) {
  //       try {
  //         const parsed = JSON.parse(savedChat);
  //         if (parsed?.messages) {
  //           return {
  //             messages: parsed.messages.map((msg: any) => ({
  //               id: msg.id || uuidv4(),
  //               content: msg.content,
  //               role: msg.role,
  //               sendType: msg.sendType,
  //               timestamp: new Date(msg.timestamp || Date.now()),
  //               agentType: msg.agentType,
  //             })),
  //             isTyping: false,
  //             isOpen: false,
  //           };
  //         }
  //       } catch (error) {
  //         console.error("Failed to parse chat history:", error);
  //       }
  //     }
  //   }
  //   return {
  //     messages: [INITIAL_MESSAGE],
  //     isTyping: false,
  //     isOpen: false,
  //   };
  // }, []);

  const defaultChatState: ChatState = {
    messages: [INITIAL_MESSAGE], // Default to initial message
    isTyping: false,
    isOpen: false,
  };
  const [chatState, setChatState] = useState<ChatState>(defaultChatState);

  // useEffect(() => {
  //   const chatId = localStorage.getItem("chatID");
  //   if (socket && chatId) {
  //     const handleMessages = (messages: any) => {

  //       if (Array.isArray(messages)) {
  //         setChatState((prevState) => ({
  //           ...prevState,
  //           messages: [
  //             ...prevState.messages,
  //             ...messages.map((msg: any) => ({
  //               id: msg._id || uuidv4(),
  //               content: msg.content,
  //               role: msg.sendType,
  //               sendType: msg.sendType,
  //               timestamp: new Date(msg.timestamp || Date.now()),
  //             })),
  //           ],
  //         }));
  //       }
  //     };

  //     socket.on("get-messages", handleMessages);
  //     socket.emit("get-messages", { chatId });

  //     return () => {
  //       socket.off("get-messages", handleMessages);
  //     };
  //   }
  // }, [socket]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentsUrls, setAttachmentsUrls] = useState<any[]>([]);
  useEffect(() => {
    let userid = localStorage.getItem("userid");
  }, []);

  // useEffect(() => {
  //   localStorage?.setItem(
  //     "chatHistory",
  //     JSON.stringify({
  //       messages: chatState.messages.map((msg) => ({
  //         ...msg,
  //         timestamp: msg.timestamp.toISOString(),
  //         flowState: msg.flowState,
  //       })),
  //     })
  //   );
  // }, [chatState.messages]);

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
          attachments: attachmentsUrls.length > 0 ? [...attachmentsUrls] : [],
        },
      ],
      isTyping: true,
    }));

    if (socket) {
      // console.log("Attachments before state update:", attachmentsUrls);
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
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userid: localStorage.getItem("userid"),
            message: content,
            attachments,
            history: chatState.messages,
            flowState: currentFlowState,
            systemTime: formattedTime,
          }),
        });

        if (!response.ok) throw new Error("Failed to get response");

        const data = await response.json();

        //console.log(data);

        if (data.hasOwnProperty('isNewHumanChatRequest') && data.isNewHumanChatRequest) {
          // Check if activeAgentId and chatID are not undefined
          const activeAgentId = data.activeAgentId;
          const chatId = localStorage.getItem("chatID");
          if (activeAgentId && chatId && socket) {
            // Emit 'transfer-chat' event with activeAgentId and chatId
            socket.emit('transfer-chat', { department: activeAgentId, chatId }, (response:any) => {
             
              if(response.success===true){
                setIsHuman(true)
              }else{
                console.log("Server response:", response);
              }
            });
          } else {
            console.error("activeAgentId or chatId is undefined");
          }
        }
        
        const assistantMessage: Message = {
          id: uuidv4(),
          content: data.message,
          role: "assistant",
          sendType: "assistant",
          receiver: localStorage.getItem("chatID") || undefined,
          receiverType: "user",
          timestamp: new Date(),
          agentType: data.agentType,
        };

        if (socket) {
          socket.emit("save-message", {
            id: uuidv4(),
            content: data.message,
            role: "assistant",
            receiver: localStorage.getItem("chatID") || undefined,
            receiverType: "user",
            sendType: "assistant",
            chatId: localStorage.getItem("chatID"),
            timestamp: new Date(),
            agentType: data.agentType,
          });
          setChatState((state) => ({
            ...state,
            messages: [
              ...state.messages.filter((msg) => msg.id !== userMessageId),
              {
                id: userMessageId,
                content,
                role: "user",
                sendType: "user",
                receiverType: "assistant",
                chatId: localStorage.getItem("chatID"),
                sender: localStorage.getItem("userid"),
                attachments:
                  attachmentsUrls.length > 0 ? [...attachmentsUrls] : [],
                timestamp: new Date(),
              },
              assistantMessage,
            ],
            isTyping: false,
          }));
        }
      } else {
        console.error("Socket is null");
      }
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

  return (
    <>
      <AnimatePresence>
        {chatState.isOpen && (
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
                  <ChatMessage key={message.id} message={message} />
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
        )}
      </AnimatePresence>

      <motion.div
        animate={chatState.isOpen ? { scale: 0 } : { scale: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          size="lg"
          variant="ghost"
          onClick={() => setChatState((s) => ({ ...s, isOpen: true }))}
        >
          <Image
            src={
              "https://registry.npmmirror.com/@lobehub/fluent-emoji-3d/1.1.0/files/assets/1f916.webp"
            }
            width={50}
            height={50}
            alt="Chat Bot"
            className="rounded-md"
          />
        </Button>
      </motion.div>
    </>
  );
}
