"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockService = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
class BedrockService {
    constructor(config) {
        this.client = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: config.region,
            credentials: config.accessKeyId && config.secretAccessKey ? {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
                sessionToken: config.sessionToken,
            } : undefined,
        });
        this.modelId = config.modelId;
    }
    async analyzeStandup(analysis) {
        const prompt = this.buildAnalysisPrompt(analysis);
        try {
            const response = await this.invokeModel(prompt);
            return this.parseQuestionsFromResponse(response, analysis.currentEntry.id);
        }
        catch (error) {
            console.error('Error analyzing standup:', error);
            return [];
        }
    }
    async generateFollowUpQuestions(originalQuestion, answer, context) {
        const prompt = this.buildFollowUpPrompt(originalQuestion, answer, context);
        try {
            const response = await this.invokeModel(prompt);
            return this.parseQuestionsFromResponse(response, originalQuestion.entryId);
        }
        catch (error) {
            console.error('Error generating follow-up questions:', error);
            return [];
        }
    }
    buildAnalysisPrompt(analysis) {
        const { currentEntry, previousEntry, incompleteTickets, longRunningPRs } = analysis;
        return `You are a team lead conducting a standup review. Analyze the following standup information and generate relevant questions.

CURRENT STANDUP:
Date: ${currentEntry.date}
Member: ${currentEntry.memberName}
Yesterday: ${currentEntry.yesterday}
Today: ${currentEntry.today}
Blockers: ${currentEntry.blockers}
Tickets: ${currentEntry.tickets.join(', ')}
Pull Requests: ${currentEntry.pullRequests.join(', ')}

${previousEntry ? `PREVIOUS STANDUP (${previousEntry.date}):
Yesterday: ${previousEntry.yesterday}
Today: ${previousEntry.today}
Tickets: ${previousEntry.tickets.join(', ')}
Pull Requests: ${previousEntry.pullRequests.join(', ')}` : 'No previous standup data available.'}

ANALYSIS:
- Incomplete tickets from previous days: ${incompleteTickets.join(', ') || 'None'}
- Long-running PRs (>3 days): ${longRunningPRs.join(', ') || 'None'}

Generate 2-4 specific, actionable questions based on:
1. Incomplete tickets that were mentioned before but not completed
2. Pull requests that have been open for multiple days
3. Recurring blockers or issues
4. Inconsistencies between previous "today" plans and current "yesterday" accomplishments
5. Missing context or unclear updates

Format your response as JSON array with this structure:
[
  {
    "question": "Why wasn't ticket THM-1234 completed as planned yesterday?",
    "questionType": "incomplete_ticket",
    "context": "Ticket THM-1234 was mentioned in yesterday's plan but not in today's completed work"
  }
]

Question types: incomplete_ticket, unmerged_pr, blocker_followup, general`;
    }
    buildFollowUpPrompt(originalQuestion, answer, context) {
        return `Based on the team member's response to a standup question, generate appropriate follow-up questions if needed.

ORIGINAL QUESTION: ${originalQuestion.question}
QUESTION TYPE: ${originalQuestion.questionType}
MEMBER'S ANSWER: ${answer}

RECENT CONTEXT:
${context.map(entry => `${entry.date}: ${entry.summary}`).join('\n')}

If the answer is satisfactory and complete, return an empty array.
If follow-up is needed, generate 1-2 specific questions to:
1. Get more details about blockers or delays
2. Understand timeline for resolution
3. Identify if help is needed
4. Clarify next steps

Format as JSON array with the same structure as before.`;
    }
    async invokeModel(prompt) {
        const body = JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });
        const command = new client_bedrock_runtime_1.InvokeModelCommand({
            modelId: this.modelId,
            body: body,
            contentType: "application/json",
            accept: "application/json"
        });
        const response = await this.client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        return responseBody.content[0].text;
    }
    parseQuestionsFromResponse(response, entryId) {
        try {
            // Extract JSON from response if it's wrapped in other text
            const jsonMatch = response.match(/\[.*\]/s);
            const jsonString = jsonMatch ? jsonMatch[0] : response;
            const questions = JSON.parse(jsonString);
            return questions.map((q) => ({
                id: this.generateId(),
                entryId,
                question: q.question,
                questionType: q.questionType || 'general',
                context: q.context || '',
                timestamp: new Date().toISOString(),
            }));
        }
        catch (error) {
            console.error('Error parsing questions from response:', error);
            console.error('Response was:', response);
            return [];
        }
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
exports.BedrockService = BedrockService;
//# sourceMappingURL=bedrockService.js.map