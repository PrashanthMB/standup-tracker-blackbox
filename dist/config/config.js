"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.defaultConfig = {
    bedrock: {
        region: process.env.AWS_REGION || 'us-east-1',
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
    },
    dataStorage: {
        type: 'excel',
        filePath: './data/standup-data.xlsx',
        backupPath: './data/backup/',
    },
    agent: {
        maxQuestions: 5,
        questionTimeout: 30000,
        analysisDepth: 7, // days to look back
    },
};
//# sourceMappingURL=config.js.map