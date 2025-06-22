import { StandupEntry, AgentQuestion } from '../models/standup';
import { DataStorage } from '../utils/dataStorage';
import { BedrockService } from '../services/bedrockService';
export declare class StandupAgent {
    private dataStorage;
    private bedrockService;
    private maxQuestions;
    constructor(dataStorage: DataStorage, bedrockService: BedrockService, maxQuestions?: number);
    processStandupEntry(rawNotes: string, memberName: string): Promise<{
        entry: StandupEntry;
        questions: AgentQuestion[];
    }>;
    answerQuestion(questionId: string, answer: string): Promise<AgentQuestion[]>;
    private findOrCreateMember;
    private parseStandupNotes;
    private generateSummary;
    private analyzeStandupEntry;
    private extractTicketsFromText;
    saveStandupEntry(entry: StandupEntry): Promise<void>;
    private saveQuestions;
    private extractMemberIdFromEntry;
    getPendingQuestions(memberId?: string): Promise<AgentQuestion[]>;
    getTeamProgress(days?: number): Promise<any>;
}
//# sourceMappingURL=standupAgent.d.ts.map