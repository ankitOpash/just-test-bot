"use client";

import { Message } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

 // console.log(message, "message");
  //console.log(message.attachments, "attachments"); // Add this line to log attachments

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 ring-2 ring-offset-2 ring-offset-background">
        <AvatarImage
          src={
            isUser
              ? "https://api.dicebear.com/9.x/personas/svg?seed=Oliver"
              : "https://registry.npmmirror.com/@lobehub/fluent-emoji-3d/1.1.0/files/assets/1f916.webp"
          }
          alt={isUser ? "User" : "Assistant"}
          className={cn(!isUser && "bg-blue-500 p-1.5")}
        />
        <AvatarFallback
          className={cn("text-white", isUser ? "bg-zinc-600" : "bg-blue-500")}
        >
          {isUser ? "U" : "A"}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex flex-col gap-1 max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser ? "bg-blue-500 text-white" : "bg-muted"
          )}
        >
          {message?.attachments && message?.attachments?.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="rounded overflow-hidden">
                  {attachment?.type === "image" ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="max-w-full h-auto"
                    />
                  ) : (
                    <div className="bg-white/10 p-2 rounded flex items-center space-x-2">
                      <span>📄</span>
                      <span className="truncate">{attachment?.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <ReactMarkdown className="prose dark:prose-invert prose-sm">
            {message.content}
          </ReactMarkdown>
        </div>

        <span className="text-xs text-muted-foreground px-1">
          {format(message.timestamp, "HH:mm")}
        </span>
      </div>
    </div>
  );
}
