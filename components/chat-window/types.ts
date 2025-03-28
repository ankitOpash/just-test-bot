// export interface Message {
//   id: string;
//   content: string;
//   role: "user" | "assistant";
//   timestamp: Date;
//   options?: string[];
//   receiver?: string;
//   receiverType?: string;
//   sendType: string;
//   agentType?: AgentType;
//   flowState?: FlowState;
//   attachments?: any[];
// }

export interface Message {
  id: string;
  content: string;
  options?: string[]; // This can be removed if you use messageOptions instead
  role: string;
  sendType?: string;
  timestamp: Date;
  isInteractive?: boolean;
  sender?: string | null; 
  agentType?: AgentType;
  flowState?: FlowState;
  receiver?: string;
  receiverType?: string;
  attachments?: any[];
  messageType?: string; // Add messageType to match backend
  messageOptions?: { label: string; value: string }[]; // Add messageOptions to match backend
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  isOpen: boolean;
  activeAgent?: AgentType;
}

export interface FlowState {
  currentStep: number;
  collectedData: Record<string, any>;
  activeFlow: "car_quotation" | null;
}

export interface CarFunctionResponse {
  message: string;
  data?: any;
  error?: string;
}

export type AgentType = "general";
