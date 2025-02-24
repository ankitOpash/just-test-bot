import { NextResponse } from "next/server";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "langchain/document";

import pLimit from "p-limit";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const MAX_TOKENS = 500;
// Define an interface for your department details (adjust as needed)
interface Department {
  _id: string;
  name: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
  agentCount: number;
}

interface DepartmentDetails {
  qAndA?: string;
  documents?: string;
  other?: string;
}

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
// async function fetchDepartmentDetails(department: Department): Promise<Document[]> {
//   const documents: Document[] = [];
//   const { _id, name } = department;
//   const detailsUrl = `${process.env.DEPARTMENT_DETAILS_API_BASE_URL}/${_id}`;

//   try {
//     const detailsResponse = await fetch(detailsUrl);
//     if (!detailsResponse.ok) {
//       console.warn(`Failed to fetch details for department ${name} (_id: ${_id}). Skipping.`);
//       return documents;
//     }
//     const details: DepartmentDetails = await detailsResponse.json();

//     // Prepare items to index. You can combine or store them separately.
//     const itemsToIndex = [
//       { content: details.qAndA, title: `${name} - Q/A`, source: `${detailsUrl}/qAndA` },
//       { content: details.documents, title: `${name} - Documents`, source: `${detailsUrl}/documents` },
//       { content: details.other, title: `${name} - Other`, source: `${detailsUrl}/other` },
//     ];

//     // Process each content block using LangChain’s text splitter
//     for (const item of itemsToIndex) {
//       const { content, title, source } = item;
//       if (!content || typeof content !== 'string') continue;

//       // Use the text splitter for more natural splits
//       const chunks = await textSplitter.splitText(content);
//       for (const chunk of chunks) {
//         documents.push(
//           new Document({
//             pageContent: chunk,
//             metadata: {
//               departmentId: _id,
//               departmentName: name,
//               title,
//               source,
//             },
//           })
//         );
//       }
//     }
//   } catch (error: any) {
//     console.error(`Error fetching details for department ${name} (_id: ${_id}):`, error);
//   }

//   return documents;
// }
export async function POST(req: Request) {
    try {
      // Define the specific URLs to visit
      // const { url } = await req.json();
      console.log("hello");
      const documents: Document[] = [];
      const detailsUrl = `${process.env.DEPARTMENT_DETAILS_API_BASE_URL}`;
      const detailsResponse = await fetch(detailsUrl);
      if (!detailsResponse.ok) {
        console.warn(`Failed to fetch details for department. Skipping.`);
        return NextResponse.json({ success: false, message: "Failed to fetch details." });
      }
      //@ts-ignore
      const details: any = await detailsResponse.json();
      //console.log("details", details?.data);
  
    //   const itemsToIndex = [
    //     { content: details?.data?.QNA, title: `health Insurance - Q/A`, source: `${detailsUrl}/qAndA` },
    //     { content: details?.data?.Upload, title: `health Insurance - Documents`, source: `${detailsUrl}/documents` },
    //     { content: details.other, title: `health Insurance- Other`, source: `${detailsUrl}/other` },
    //   ];
  

    //   console.log(itemsToIndex);
      
      const itemsToIndex = [
        { content: details?.data?.QNA, title: `General Insurance - Q/A`, source: `${detailsUrl}/qAndA` },
        { content: details?.data?.Upload, title: `General Insurance - Documents`, source: `${detailsUrl}/documents` },
        { content: details.other, title: `General Insurance- Other`, source: `${detailsUrl}/other` },
      ];
  
      for (const item of itemsToIndex) {
        let { content, title, source } = item;
        if (!content) continue;
  
        // Convert content to string if it's an array of objects
        if (Array.isArray(content)) {
          content = content.map(obj => JSON.stringify(obj)).join(' ');
        }
  
        if (typeof content !== 'string') continue;
  
        // Use the simple text splitter for more natural splits
        const chunks = splitTextIntoChunks(content,MAX_TOKENS);
        for (const chunk of chunks) {
          documents.push(
            new Document({
              pageContent: chunk,
              metadata: {
                departmentId: details?.data?._id || "General",
                departmentName: details?.data?.name || "General",
                title,
                source,
              },
            })
          );
        }
      }
  
  
      // Removed the loop over `scrapedData` as it was not defined in the provided code

      console.log(documents);
      
  
      const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
      const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
  
      // Store documents in Pinecone
      if (documents.length > 0) {
        console.log("Embedding and storing documents in Pinecone...");
        //@ts-ignore
        await PineconeStore.fromDocuments(documents, embeddings, { pineconeIndex });
        console.log("Successfully stored documents in Pinecone.");
      } else {
        console.log("No documents to store in Pinecone.");
      }
  
      return NextResponse.json({
        success: true,
        message: "Stored successfully.",
      });
    } catch (error: any) {
      console.error("Error during crawl or storage:", error.message);
      return NextResponse.json(
        { error: "Failed to process URL", details: error.message },
        { status: 500 }
      );
    }
  }