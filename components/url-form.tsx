"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
// import { useToast } from "@/components/ui/use-toast";

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

type FormData = z.infer<typeof urlSchema>;

export function URLForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(urlSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to crawl URL");

      toast({
        title: "Success!",
        description: "Website has been crawled and processed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to crawl the website. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">Website URL</Label>
        <Input
          id="url"
          placeholder="https://methaq.ae/en/home-1-2/"
          {...register("url")}
          className={errors.url ? "border-destructive" : ""}
           readOnly
        />
        {errors.url && (
          <p className="text-sm text-destructive">{errors.url.message}</p>
        )}
      </div>
      <Button type="submit" disabled={true} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Crawling...
          </>
        ) : (
          "Start Crawling"
        )}
      </Button>
    </form>
  );
}
