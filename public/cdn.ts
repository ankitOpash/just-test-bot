// Adjust the import path as necessary

import { ChatWidget } from "../components/chat/ChatWidget";

if (typeof window !== "undefined") {
  window.FastBots = { ChatWidget };
}
