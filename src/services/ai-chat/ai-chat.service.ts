import { drizzleAdapter } from '../../adapters';
import { AiChatService } from './ai-chat.class';
import { aiChatHooks } from './ai-chat.hooks';

export const aiChatService = new AiChatService(drizzleAdapter);

if ((aiChatService as any).hooks) {
    (aiChatService as any).hooks(aiChatHooks);
}
