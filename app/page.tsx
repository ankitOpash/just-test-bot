"use client"
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

export default function Home() {

  // const handlePipe= async()=>{

  //   console.log("i am calll");
    
  //   const response = await fetch("/api/add-pinecone", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
    
  //   });
  //   console.log(response);
  
  // }
  return (
    <main className="container mx-auto p-4 min-h-screen">
      <div className="flex flex-col items-center justify-center space-y-8 py-8">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6" />
          <h1 className="text-2xl font-bold">AI Bot</h1>
          {/* <button
          
          onClick={()=>{handlePipe()}}
        >
          fjdfdjfj
        </button> */}
        </div>
      </div>
    </main>
  );
}
