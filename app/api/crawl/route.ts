import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Document } from "langchain/document";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const MAX_TOKENS = 500; // Chunk size for document splitting
// export const runtime = 'edge';
// Helper function to split text into smaller chunks for Pinecone storage
function splitTextIntoChunks(text: string, chunkSize: number): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    if (currentChunk.join(" ").length + word.length + 1 > chunkSize) {
      chunks.push(currentChunk.join(" "));
      currentChunk = [];
    }
    currentChunk.push(word);
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}

// Main crawl and store function
export async function POST(req: Request) {
  try {
    // Define the specific URLs to visit
    const { url } = await req.json();
    const toVisit = [
      "https://methaq.ae/services_group/retakaful-objectives/",
      "https://methaq.ae/en/services_group/retakaful-objectives/",
      "https://methaq.ae/services_group/customer-services/",
      "https://methaq.ae/en/services_group/customer-services/",
      "https://methaq.ae/services/ar-technical-support/",
      "https://methaq.ae/contact-ar/",
      "https://methaq.ae/faq-ar/",
      "https://methaq.ae/investor-relations/",
      "https://methaq.ae/corporate-insurance-ar/",
      "https://methaq.ae/contacts/",
      "https://methaq.ae/ar/medical-insurance-in-uae-ar/",
      "https://methaq.ae/health-care-plans-for-abu-dhabi-residents-ar/",
      "https://methaq.ae/medical-insurance-in-uae-ar/",
      "https://methaq.ae/motor-insurance-ar/",
      "https://methaq.ae/health-insurance-for-all-your-family/",
      "https://methaq.ae/big-protection-for-small-business/",
      "https://methaq.ae/car-insurance-you-can-count-on/",
      "https://methaq.ae/take-care-of-your-sweet-home/",
      "https://methaq.ae/en/services/optimum-capacities/",
      "https://methaq.ae/ar/faq-ar/",
      "https://methaq.ae/ar/corporate-insurance-ar/"
    ];

    const visited = new Set<string>();
    const scrapedData: { content: string; title: string }[] = [];

    // Launch Puppeteer to scrape the website
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (const currentUrl of toVisit) {
      if (visited.has(currentUrl)) continue;

      visited.add(currentUrl);
      try {
        console.log(`Visiting: ${currentUrl}`);
        await page.goto(currentUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

        // Extract text content using Cheerio
        const content = await page.content();
        const $ = cheerio.load(content);

        const pageText = $("body")
          .find("*")
          .not("script, style, nav, footer, header")
          .text()
          .replace(/\s+/g, " ")
          .trim();

        const pageTitle = $("title").text().trim(); // Extract title

        if (pageText) {
          scrapedData.push({ content: pageText, title: pageTitle });
        }
      } catch (err) {
        //@ts-ignore
        console.error(`Error visiting ${currentUrl}:`, err.message);
      }
    }

    await browser.close();
    console.log("Crawling complete.");

    // Prepare data for Pinecone
    console.log("Preparing data for Pinecone...");
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
    const documents: Document[] = [];

    for (const { content, title } of scrapedData) {
      const chunks = splitTextIntoChunks(content, MAX_TOKENS);
      for (const chunk of chunks) {
        documents.push(
          new Document({
            pageContent: chunk,
            metadata: { source: url, title },
          })
        );
      }
    }

    // Store documents in Pinecone
    if (documents.length > 0) {
      console.log("Embedding and storing documents in Pinecone...");
      //@ts-ignore
      await PineconeStore.fromDocuments(documents, embeddings, { pineconeIndex });
      console.log("Successfully stored documents in Pinecone.");
    } else {
      console.log("No documents to store in Pinecone.");
    }

    return NextResponse.json({ success: true, message: "Data crawled and stored successfully." });
  } catch (error: any) {
    console.error("Error during crawl or storage:", error.message);
    return NextResponse.json({ error: "Failed to process URL", details: error.message }, { status: 500 });
  }
}