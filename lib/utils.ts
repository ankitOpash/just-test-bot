import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Open a connection to the IndexedDB database
function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("chatHistoryDB", 1);

    // Create object store if it doesn't exist
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("chats")) {
        db.createObjectStore("chats", { keyPath: "sessionId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event);
  });
}

// Function to save chat history in IndexedDB
async function saveChatHistory(sessionId: string, messages: string[]) {
  const db = await openDatabase();
  const transaction = db.transaction("chats", "readwrite");
  const store = transaction.objectStore("chats");
  store.put({ sessionId, messages });
}

// Function to retrieve chat history from IndexedDB
async function getChatHistory(sessionId: string): Promise<string[]> {
  const db = await openDatabase();
  const transaction = db.transaction("chats", "readonly");
  const store = transaction.objectStore("chats");
  const request = store.get(sessionId);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.messages : []);
    };
    request.onerror = (event) => reject(event);
  });
}

export const getFileName = (url: string) =>
  url?.split("/")?.pop?.()?.split("-")?.pop?.() || "";
