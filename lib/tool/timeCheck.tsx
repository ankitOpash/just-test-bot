import { z } from "zod";
import { StructuredTool } from "langchain/tools";
class TimeCheckTool extends StructuredTool {
  schema = z.object({
    startTime: z.string(), // Expecting time in HH:mm:ss format
    endTime: z.string(),
  });
  name = "checkTime";
  description = "Check if it's currently within working hours";

  async _call(input: { startTime: string; endTime: string }) {
    const currentHour = new Date().getHours();
    const startHour = parseInt(input.startTime.split(":")[0]);
    const endHour = parseInt(input.endTime.split(":")[0]);
    if (currentHour >= 0 && currentHour < 24) {
      // Adjusted working hours to 9 AM - 5 PM
      return "We are currently online and ready to assist you.";
    } else {
      return "We are currently offline";
    }
  }
}

export const timeCheckTool = new TimeCheckTool();

class ChatTransferTool extends StructuredTool {
  schema = z.object({
    name: z.string().optional().describe("The user's name"),
    email: z.string().optional().describe("The user's email"),
  });
  name = "chatTransfer";
  description = "Transfer chat to a human operator";

  async _call(input: { name?: string; email?: string }) {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (input.email && !emailRegex.test(input.email)) {
      return "Please provide a valid email address.";
    }

    // If both name and email are provided, transfer the chat
    if (input.name && input.email) {
      return `Transferring chat to a human operator. User details:\n\n- **Name**: ${input.name}\n- **Email**: ${input.email}`;
    }
    // If only name is provided, ask for the email
    else if (input.name) {
      return `Please provide your email to transfer the chat.`;
    }
    // If only email is provided, ask for the name
    else if (input.email) {
      return `Please provide your name to transfer the chat.`;
    }
    // If neither name nor email is provided, ask for both
    else {
      return `Please provide your name and email to transfer the chat.`;
    }
  }
}

export const chatTransferTool = new ChatTransferTool();

class DocumentProcessTool extends StructuredTool {
  // Define the expected input schema
  schema = z.object({
    attachments: z
      .array(
        z.object({
          // URL or base64 content of the image
          url: z.string().optional(),
          base64: z.string().optional(),
          // Metadata to determine which document is which:
          documentType: z
            .string()
            .optional()
            .describe(
              'Document type. Expected values: "CarRC", "DL", or "ID".'
            ),
          side: z
            .string()
            .optional()
            .describe(
              'Side of the document. Expected values: "front" or "back".'
            ),
        })
      )
      .nonempty(),
  });

  name = "documentProcess";
  description =
    "Process document attachments step by step. It validates and processes Car RC (front/back), DL (front/back), and ID (front/back).";

  async _call(input: { attachments: Array<any> }) {
    const attachments = input.attachments;
    // Define the required document types with both sides.
    const requiredDocs = {
      CarRC: { front: null, back: null },
      DL: { front: null, back: null },
      ID: { front: null, back: null },
    };

    // Process each attachment, expecting metadata "documentType" and "side"
    for (const att of attachments) {
      if (!att.documentType || !att.side) continue; // Skip if metadata is missing
      const docType = att.documentType;
      const side = att.side.toLowerCase();
      //@ts-ignore
      if (requiredDocs[docType] && (side === "front" || side === "back")) {
        //@ts-ignore
        requiredDocs[docType][side] = att;
      }
    }

    // Verify all required attachments are provided.
    for (const docType in requiredDocs) {
      //@ts-ignore
      if (!requiredDocs[docType].front) {
        return `Missing ${docType} front image. Please provide a front image for ${docType}.`;
      }
      //@ts-ignore
      if (!requiredDocs[docType].back) {
        return `Missing ${docType} back image. Please provide a back image for ${docType}.`;
      }
    }

    // At this point, all required documents are available.
    // You can now process each image (e.g., uploading, OCR extraction, etc.).
    // For demonstration, we'll simulate processing and return a record.
    const processedRecords = {};
    for (const docType in requiredDocs) {
      //@ts-ignore
      processedRecords[docType] = {
        //@ts-ignore
        front: requiredDocs[docType].front,
        //@ts-ignore
        back: requiredDocs[docType].back,
        status: "Processed",
      };
    }

    // Optionally, save these records in a database or any other storage mechanism.
    // For now, we simply return a success message with the processed records.
    return JSON.stringify({
      message: "All documents processed successfully.",
      records: processedRecords,
    });
  }
}

export const documentProcessTool = new DocumentProcessTool();
