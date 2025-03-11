"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, Paperclip, X } from "lucide-react";
import { useState, useRef } from "react";

interface ChatInputProps {
  onSend: (content: string, attachments: any[], attachmentsUrls: any[]) => void;
  isTyping: boolean;
  setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
  attachments: any[];
  attachmentsUrls: any[];
  setAttachmentsUrls: React.Dispatch<React.SetStateAction<any[]>>;
}

export function ChatInput({
  onSend,
  isTyping,
  setAttachments,
  attachments,
  attachmentsUrls,
  setAttachmentsUrls,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state

  const handleSubmit = () => {
    if (message.trim() || attachments.length > 0) {
      //@ts-ignore
      onSend(message, attachments, attachmentsUrls);
      setMessage("");
      setAttachments([]);
      setAttachmentsUrls([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      setFile(event.target.files[0]);
    }
  };

  // const handleFileSelect = async(event: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = event.target.files;
  //   if (!files) return;

  //   Array.from(files).forEach((file) => {
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       const url = e.target?.result as string;
  //       const type = file.type.startsWith("image/") ? "image" : "pdf";

  //       setAttachments((prev) => [
  //         ...prev,
  //         {
  //           type,
  //           url,
  //           name: file.name,
  //         },
  //       ]);
  //     };
  //     reader.readAsDataURL(file);
  //   });

  //   // Reset file input

  //   const formData = new FormData();
  //   formData.append('file', file);

  //   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/chat/uploadDocument`, {
  //     method: 'POST',
  //     body: formData,
  //   });

  //   if (!response.ok) {
  //     console.error('Failed to upload file:', response.statusText);
  //     return;
  //   }

  //   event.target.value = "";
  // };
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsLoading(true);
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Loop through all selected files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Create a new FileReader object
      const reader = new FileReader();

      reader.onload = async (e) => {
        const url = e.target?.result as string;
        const type = file.type.startsWith("image/") ? "image" : "pdf";

        setAttachments((prev) => [
          ...prev,
          {
            type,
            url,
            name: file.name,
          },
        ]);

        // Upload file to S3 bucket
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/public/chat/uploadDocument`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          console.error("Failed to upload file:", response.statusText);
          return;
        }

        const data = await response.json();
        setAttachmentsUrls((prev) => [...prev, data.url]);
        //console.log("File uploaded successfully:", data);
      };
      setIsLoading(false);
      reader.readAsDataURL(file);
    }

    // Reset file input
    event.target.value = "";
  };

  const removeAttachment = async (index: number, url: string) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/public/chat/deleteDocument`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePathToDelete: url,
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to delete file:", response.statusText);
      return;
    }

    console.log("File deleted successfully");
  };

  return (
    <div className="border-t p-4">
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative group">
              {attachment.type === "image" ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                  📄
                </div>
              )}
              <button
                onClick={() => removeAttachment(index, attachment.url)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="min-h-[44px] resize-none rounded-full"
          rows={1}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
        
          multiple
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <Button
          onClick={handleSubmit}
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full bg-blue-500 hover:bg-blue-600"
          disabled={isTyping || isLoading}
        >
          <SendIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
