export interface BedrockConfig {
    region: string;
    modelId: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
}
export interface AppConfig {
    bedrock: BedrockConfig;
    dataStorage: {
        type: 'excel' | 'json';
        filePath: string;
        backupPath: string;
    };
    agent: {
        maxQuestions: number;
        questionTimeout: number;
        analysisDepth: number;
    };
}
export declare const defaultConfig: AppConfig;
//# sourceMappingURL=config.d.ts.map