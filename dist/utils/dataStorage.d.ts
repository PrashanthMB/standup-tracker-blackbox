import { StandupEntry, TeamMember, AgentQuestion } from '../models/standup';
export declare class DataStorage {
    private filePath;
    private backupPath;
    private storageType;
    constructor(filePath: string, backupPath: string, storageType?: 'excel' | 'json');
    private ensureDirectories;
    private createBackup;
    saveStandupEntries(entries: StandupEntry[]): Promise<void>;
    loadStandupEntries(): Promise<StandupEntry[]>;
    saveTeamMembers(members: TeamMember[]): Promise<void>;
    loadTeamMembers(): Promise<TeamMember[]>;
    saveAgentQuestions(questions: AgentQuestion[]): Promise<void>;
    loadAgentQuestions(): Promise<AgentQuestion[]>;
    private saveToExcel;
    private loadFromExcel;
    private saveToJson;
    private loadFromJson;
    getEntriesByMember(memberId: string, days?: number): Promise<StandupEntry[]>;
    getLatestEntryByMember(memberId: string): Promise<StandupEntry | undefined>;
}
//# sourceMappingURL=dataStorage.d.ts.map