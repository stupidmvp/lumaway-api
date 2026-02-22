import { handleAiChat } from './hooks/handleAiChat';

// ai-chat uses API key auth (x-api-key header), not JWT — no standard authenticate hook
export const aiChatHooks = {
    before: {
        all: [],
        create: [handleAiChat],
    },
};
