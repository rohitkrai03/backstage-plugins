import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { InMemoryStore } from '@langchain/core/stores';

import { Roles } from '../service/types';

const historyStore = new InMemoryStore<BaseMessage[]>();

export async function saveHistory(
  conversation_id: string,
  role: string,
  message: string,
  timestamp?: number,
): Promise<void> {
  let newMessage: BaseMessage;
  switch (role) {
    case Roles.AIRole: {
      newMessage = new AIMessage({
        content: message,
        response_metadata: {
          created_at: timestamp || Date.now(),
        },
      });
      break;
    }
    case Roles.HumanRole: {
      newMessage = new HumanMessage({
        content: message,
        response_metadata: {
          created_at: timestamp || Date.now(),
        },
      });
      break;
    }
    case Roles.SystemRole: {
      newMessage = new SystemMessage({
        content: message,
        response_metadata: {
          created_at: timestamp || Date.now(),
        },
      });
      break;
    }
    default:
      throw new Error(`Unknown role: ${role}`);
  }

  const sessionHistory = await historyStore.mget([conversation_id]);
  let newHistory: BaseMessage[] = [];
  if (sessionHistory && sessionHistory[0]) {
    newHistory = sessionHistory[0];
  }
  newHistory.push(newMessage);
  await historyStore.mset([[conversation_id, newHistory]]);
}

export async function loadHistory(
  conversation_id: string,
  historyLength: number,
): Promise<BaseMessage[]> {
  const sessionHistory = await historyStore.mget([conversation_id]);
  if (!sessionHistory[0]) {
    throw new Error(`unknown conversation_id: ${conversation_id}`);
  }
  return sessionHistory[0]?.slice(-historyLength);
}

export async function deleteHistory(conversation_id: string): Promise<void> {
  return await historyStore.mdelete([conversation_id]);
}

export async function loadAllConversations(user_id: string): Promise<string[]> {
  const conversationIDList = [];
  for await (const key of historyStore.yieldKeys(user_id)) {
    conversationIDList.push(key);
  }
  return conversationIDList;
}
