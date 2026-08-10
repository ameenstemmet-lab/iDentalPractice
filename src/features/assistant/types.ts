export type AssistantRole = "user" | "assistant";

export interface AssistantMessage {
  role: AssistantRole;
  content: string;
}
