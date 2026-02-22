import { drizzleAdapter } from '../../adapters';
import { AiChatResetService } from './ai-chat-reset.class';
import { aiChatResetHooks } from './ai-chat-reset.hooks';

export const aiChatResetService = new AiChatResetService(drizzleAdapter);

if ((aiChatResetService as any).hooks) {
    (aiChatResetService as any).hooks(aiChatResetHooks);
}
