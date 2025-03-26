"use client";

import { Message } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: Message;
  handleOptionSelect: (option: any) => void;
}

export function ChatMessage({ message, handleOptionSelect }: ChatMessageProps) {
  const isUser = message.role === "user";

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
            <div className="">
              {message.attachments?.flat()?.map((attachment, index) => {
                // Determine if the attachment is a string (direct URL) or an object
                const isUrl = typeof attachment === "string";
                const url = isUrl ? attachment : attachment?.url;
                const name = isUrl ? "" : attachment?.name;

                return (
                  <div key={index} className="rounded overflow-hidden">
                    {/* Check if the attachment is an image or ends with common image file extensions */}
                    {url?.endsWith(".png") ||
                    url?.endsWith(".jpg") ||
                    url?.endsWith(".jpeg") ||
                    url?.endsWith(".gif") ? (
                      //@ts-ignore
                      <img src={url} alt={name} className="max-w-full h-auto" />
                    ) : (
                      <div className="bg-white/10 p-2 rounded flex items-center space-x-2">
                        <span>📄</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate"
                        >
                          {name}
                        </a>
                        <a href={url} download className="ml-2">
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <ReactMarkdown className="prose dark:prose-invert prose-sm break-words whitespace-pre-wrap">
            {message.content}
          </ReactMarkdown>
          {message.messageOptions && message.messageOptions.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.messageOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  className="block w-full text-left px-3 py-2 bg-white text-blue-600 rounded border border-blue-300 hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-xs text-muted-foreground px-1">
          {format(message.timestamp, "HH:mm")}
        </span>
      </div>
    </div>
  );
}
