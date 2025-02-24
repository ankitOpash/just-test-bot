// Import the library
import fuzzysort from "fuzzysort";


const humanChatPhrases = [
  "transfer chat",
  "i want to chat with a human",
  "i need human assistance",
  // Add more phrases as needed
];

export function isHumanChatRequest(message: string): boolean {
    const lowerCaseMessage = message.trim().toLowerCase();
    for (const phrase of humanChatPhrases) {
      if (lowerCaseMessage === phrase) {
        return true;
      }
    }
    return false;
  }