import { BedrockConfig } from '../config/config';
import { StandupEntry, AgentQuestion, StandupAnalysis } from '../models/standup';
export declare class BedrockService {
    private client;
    private modelId;
    constructor(config: BedrockConfig);
    analyzeStandup(analysis: StandupAnalysis): Promise<AgentQuestion[]>;
    generateFollowUpQuestions(originalQuestion: AgentQuestion, answer: string, context: StandupEntry[]): Promise<AgentQuestion[]>;
    private buildAnalysisPrompt;
    private buildFollowUpPrompt;
    private invokeModel;
    private parseQuestionsFromResponse;
    private generateId;
}
//# sourceMappingURL=bedrockService.d.ts.map