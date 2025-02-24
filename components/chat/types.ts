export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  receiver?: string;
  receiverType?: string;
  sendType:string;
  agentType?: AgentType; 
  flowState?: FlowState;
  attachments?: any[];
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
  activeFlow: 'car_quotation' | null;
}

export interface CarFunctionResponse {
  message: string;
  data?: any;
  error?: string;
}

export type AgentType = 'general';