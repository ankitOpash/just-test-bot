import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic'
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import GPT3Tokenizer from "gpt3-tokenizer";
import { PromptTemplate } from "@langchain/core/prompts";
import { BufferMemory } from "langchain/memory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatMessageHistory } from "langchain/memory";
import axios from "axios";
import {
  chatTransferTool,
  documentProcessTool,
  timeCheckTool,
} from "@/lib/tool/timeCheck";
import { isHumanChatRequest } from "@/lib/tool/transferChat";

// Initialize constants and external services
const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
const MAX_TOKENS = 4096;
const RESERVED_TOKENS = 256;
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

function getTokenCount(text: string): number {
  return tokenizer.encode(text).bpe.length;
}



const userStates: { [userId: string]: { step: string; data: any } } = {};
// Fetch departments and prompts from the API
async function fetchDepartmentsAndPrompts() {
  try {
    const response = await fetch(
      "https://methaq-aibot-api.opash.in/api/public/department/departments-with-prompt"
    );
    if (!response.ok) {
      throw new Error("Failed to fetch departments and prompts");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching departments and prompts:", error);
    throw error;
  }
}

async function storeChatInDB(
  userId: string,
  sender: string,
  content: string,
  department: string
) {
  try {
    //console.log("Storing chat in the database...", userId, sender, content, department);

    await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND}/api/public/chat/store-chat`,
      {
        userId,
        sender,
        content,
        department,
      }
    );
    console.log("Chat stored successfully");
  } catch (error: any) {
    console.error("Error storing chat:", error.response?.data || error.message);
  }
}

// Store chat in the database

// Detect the department based on the message
async function detectDepartment(message: string, departments: any[]) {
  // Extract department names
  const departmentNames = departments.map((dep) => dep.name);
  console.log("Department Names:", departmentNames); // Log department names

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
  //@ts-ignore
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    //@ts-ignore
    pineconeIndex: index,
  });

  // Perform a similarity search with a higher threshold or more results
  const results = await vectorStore.similaritySearch(message, 5);
  //console.log("Similarity Search Results:", results); // Log search results

  if (results.length > 0) {
    // Attempt to find the best match based on metadata
    const bestMatch = results.find((result) => {
      const departmentName = result.metadata.departmentName;
      // console.log("Checking Department:", departmentName); // Log each department being checked
      return departmentNames.includes(departmentName);
    });

    if (bestMatch) {
      const matchedDepartment = departments.find(
        (dep) => dep.name === bestMatch.metadata.departmentName
      );

      // Access the working hours of the matched department
      const workingHours = matchedDepartment.workingHours;

      // console.log("Working Hours of Matched Department:", workingHours);

      return matchedDepartment;
    }
  }

  // Fallback to a default department if no match is found
  // console.log("No Match Found, Defaulting to General");
  return {
    name: "General Insurance",
    prompts: [],
    workingHours: { startTime: "09:00:00", endTime: "20:00:00" },
  };
}

// Build a dynamic prompt for the AI
function buildDynamicPrompt(
  agent: string,
  history: string,
  context: string,
  userQuery: string
): string {
  const availableTokens =
    MAX_TOKENS -
    RESERVED_TOKENS -
    getTokenCount(agent) -
    getTokenCount(userQuery) -
    getTokenCount(context);

  const truncatedHistory = truncateToTokenLimit(history, availableTokens);

  return `
${agent}

### 🔄 Conversation History (Context-Aware):
${truncatedHistory}

### 📌 Context:
${context}

### ❓ User Query:
${userQuery}

### ✅ AI Response:
`;
}

// Truncate text to fit within a token limit
function truncateToTokenLimit(text: string, tokenLimit: number): string {
  const encoded = tokenizer.encode(text);
  return tokenizer.decode(encoded.bpe.slice(0, tokenLimit));
}

// Main POST function to handle chat requests
export async function POST(req: Request) {
  try {
    const { userId, message, history, flowState, attachments } =
      await req.json();

    if ((!message || typeof message !== "string") && attachments.length === 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // console.log(attachments, "attachments");

    // let messageContentr = [];
    // if (attachments?.length) {
    //   // Invoke the document processing tool with the attachments
    //   const docProcessResult = await documentProcessTool.invoke({
    //     attachments,
    //   });

    //   // If the result is a string (error message), return it to the user
    //   if (typeof docProcessResult === "string") {
    //     return NextResponse.json({ message: docProcessResult });
    //   }

    //   // Otherwise, log or merge the processed document records into your chat context
    //   //@ts-ignore
    //   console.log("Processed Document Records:", docProcessResult.records);

    //   // Optionally, you could add a message to the chat history or inform the user:
    //   messageContentr.push({
    //     type: "text",
    //     text: "Your document attachments have been processed successfully.",
    //   });
    // }

  

    // Fetch departments and prompts
    const departmentsData = await fetchDepartmentsAndPrompts();

    const detectedDepartment = await detectDepartment(
      message,
      departmentsData.data
    );

    const workingHours = detectedDepartment.workingHours;
    const activeAgent = detectedDepartment?.name;
    const toolOutput = await timeCheckTool.invoke({
      startTime: workingHours.startTime,
      endTime: workingHours.endTime,
    });
    if (toolOutput === "We are currently offline") {
      return NextResponse.json({ message: toolOutput , agentType: activeAgent,});
    }


    if (isHumanChatRequest(message)) {
      userStates[userId] = { step: "name", data: {} };
      return NextResponse.json({
        message: "Please provide your name to transfer the chat.",
        agentType: activeAgent,
      });
    }

    if (userStates[userId]) {
      if (userStates[userId].step === "name") {
        const nameRegex = /^[a-zA-Z\s]{3,}$/;
        const invalidNames = ["hello", "hi", "hey", "greetings", "hii", "helo"]; // Add more invalid names as needed

        if (
          !nameRegex.test(message) ||
          invalidNames.includes(message.toLowerCase())
        ) {
          // If the name is not valid, ask for it again
          const openai = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-4o-mini",
            temperature: 0.7,
            timeout: 15000,
            maxRetries: 3,
            cache: true,
          });

          // Generate a polite message using OpenAI
          const prompt = `The user, ${
            userStates[userId].data.name || "User"
          }, provided an invalid name: "${message}". If the input is empty or contains only whitespace, politely request a name. Otherwise, if the input is one of the invalid names, politely and helpfully request a valid name, emphasizing the importance of accurate information for the transfer.  A valid name should contain at least two letters, should not contain numbers or special characters, and should not be a common greeting like "hello," "hi," "hey," or similar. Format your response using Markdown. Use bolding for key phrases. Include a relevant emoji at the end. Here's an example: **Please provide a valid name.** A valid name should contain at least two letters and should not contain numbers or special characters. 😊 Provide only the formatted message to display to the user.`;
          const response3 = await openai.invoke([prompt]);

          // Send the AI's response to the user
          return NextResponse.json({
            message: response3.content,
            agentType: activeAgent,
          });
        }
        userStates[userId].data.name = message;
        userStates[userId].step = "email";
        return NextResponse.json({
          message: "Please provide your email to transfer the chat.",
          agentType: activeAgent,
        });
      } else if (userStates[userId].step === "email") {
        // Check if the email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(message)) {
          // If the email is not valid, ask for it again
          const openai = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-4o-mini",
            temperature: 0.7,
            timeout: 15000,
            maxRetries: 3,
            cache: true,
          });

          // Generate a polite message using OpenAI
          const prompt = `The user, ${userStates[userId].data.name}, provided an email in an invalid format: "${message}". Politely inform them of the error and request a valid email address. Do not mention chat transfer or human agents. Focus solely on the email format issue. Provide only the message to display to the user.`;

          const response3 = await openai.invoke([prompt]);

          // Send the AI's response to the user
          return NextResponse.json({
            message: response3.content,
            agentType: activeAgent,
          });
        }

        // If the email is valid, proceed with the chat transfer
        userStates[userId].data.email = message;
        const toolOutput = await chatTransferTool.invoke(
          userStates[userId].data
        );
        delete userStates[userId]; // Clear the user's state
        return NextResponse.json({ message: toolOutput,agentType: activeAgent, });
      }
    }

    // Use the detected department's first prompt
    const promptTemplate =
      detectedDepartment.prompts[0]?.prompt || "Provide general assistance.";
    console.log(
      `Active department: ${JSON.stringify(detectedDepartment?.name)}`
    ); // Convert object to string
    // console.log(`Active agent: ${promptTemplate}`);
    const prompt = new PromptTemplate({
      template: promptTemplate,
      inputVariables: ["userQuery"],
    });

    const memory = new BufferMemory({
      //@ts-ignore
      maxTokenLimit: MAX_TOKENS - RESERVED_TOKENS,
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output",
      chatHistory: new ChatMessageHistory(
        //@ts-ignore
        history?.map((msg) => {
          if (msg.role === "user") {
            return new HumanMessage(msg.content);
          } else {
            return new AIMessage(msg.content);
          }
        }) || []
      ),
    });

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      //@ts-ignore
      pineconeIndex: index,
    });

    const results = await vectorStore.similaritySearch(message, 5);
    let context = results.map((r) => r.pageContent).join("\n\n");

    if (!context) {
      return NextResponse.json({
        message: "This information is not available in the dataset.",
      });
    }

    const chatHistory = await memory.chatHistory.getMessages();
    const formattedHistory = chatHistory
      .map(
        (msg) =>
          `${msg._getType() === "human" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    

    // console.log(promptTemplate);

    const promptr = buildDynamicPrompt(
      promptTemplate,
      formattedHistory,
      context,
      message
    );

    // Build the human message content as an array of content blocks.
    // Start with the dynamic text prompt.
    const messageContent: any[] = [{ type: "text", text: promptr }];

    // If there are file attachments, process each one.
    if (attachments?.length) {
      for (const attachment of attachments) {
        if (attachment.url?.startsWith("data:image")) {
          messageContent.push({
            type: "image_url",
            image_url: { url: attachment.url },
          });
        } else if (attachment.base64) {
          messageContent.push({
            type: "image_url",
            image_url: {
              url: `data:${attachment.mimeType || "image/jpeg"};base64,${
                attachment.base64
              }`,
            },
          });
        }
      }
    }
    const openai = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o",
      temperature: 0.7,
      timeout: 15000,
      maxRetries: 3,
      cache: true,
    }).bind({ tools: [timeCheckTool, chatTransferTool] });

    // const response = await openai.invoke(contentBlocks);
    const humanMessage = new HumanMessage({ content: messageContent });
    const response = await openai.invoke([humanMessage], {
      tool_choice: "auto", // Let the model decide which tool to call
    });

    await storeChatInDB(userId, "user", message, activeAgent);
    //store Ai response in DB
    //@ts-ignore
    await storeChatInDB(userId, "agent", response.content, activeAgent);

    //@ts-ignore
    await memory.chatHistory.addMessage(new HumanMessage(message));
    //@ts-ignore
    await memory.chatHistory.addMessage(new AIMessage(response));

    const updatedHistory = (await memory.chatHistory.getMessages()).map(
      (msg) => ({
        content: msg.content,
        role: msg._getType() === "human" ? "user" : "assistant",
      })
    );

    return NextResponse.json({
      message: response.content,
      history: updatedHistory,
      agentType: activeAgent,
    });
  } catch (error: any) {
    console.error("Chat API error:", error.message);
    return NextResponse.json(
      { error: "Failed to process chat request", details: error.message },
      { status: 500 }
    );
  }
}
