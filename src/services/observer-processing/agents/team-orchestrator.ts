import type { ObserverTranscriptionInput, ObserverTranscriptionResult } from './types';
import { ObserverTranscriptionAgent } from './transcription-agent';

export class ObserverProcessingTeamOrchestrator {
    constructor(
        private transcriptionAgent = new ObserverTranscriptionAgent(),
    ) { }

    async runTranscription(input: ObserverTranscriptionInput): Promise<ObserverTranscriptionResult> {
        return this.transcriptionAgent.run(input);
    }
}
