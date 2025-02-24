// Import the library
import fuzzysort from "fuzzysort";

const humanChatPhrases = [
  "transfer chat",
  "i want to chat with a human",
  "i need human assistance",
  "talk to human",
  "human help",
  "speak to agent"
].map(phrase => phrase.trim().toLowerCase());

const FUZZY_THRESHOLD = -10; // Adjust this threshold based on testing

export function isHumanChatRequest(message: string): boolean {
  const cleanedMessage = message.trim().toLowerCase();
  
  // Perform fuzzy matching
  const results = fuzzysort.go(cleanedMessage, humanChatPhrases, { threshold: FUZZY_THRESHOLD });

  return results.length > 0; // If any match is found within the threshold, return true
}