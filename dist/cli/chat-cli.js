#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startChatSession = startChatSession;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const standupAgent_1 = require("../agent/standupAgent");
const dataStorage_1 = require("../utils/dataStorage");
const bedrockService_1 = require("../services/bedrockService");
const config_1 = require("../config/config");
async function initializeAgent() {
    const dataStorage = new dataStorage_1.DataStorage(config_1.defaultConfig.dataStorage.filePath, config_1.defaultConfig.dataStorage.backupPath, config_1.defaultConfig.dataStorage.type);
    const bedrockService = new bedrockService_1.BedrockService(config_1.defaultConfig.bedrock);
    return new standupAgent_1.StandupAgent(dataStorage, bedrockService, config_1.defaultConfig.agent.maxQuestions);
}
async function startChatSession() {
    console.log(chalk_1.default.blue('💬 Standup Agent Chat Session'));
    console.log(chalk_1.default.gray('Type "exit" to quit, "help" for commands\n'));
    const agent = await initializeAgent();
    while (true) {
        try {
            const pendingQuestions = await agent.getPendingQuestions();
            if (pendingQuestions.length === 0) {
                console.log(chalk_1.default.green('✨ No pending questions! You\'re all caught up.\n'));
                const { action } = await inquirer_1.default.prompt([
                    {
                        type: 'list',
                        name: 'action',
                        message: 'What would you like to do?',
                        choices: [
                            { name: 'Check for new questions', value: 'refresh' },
                            { name: 'View team progress', value: 'progress' },
                            { name: 'Exit', value: 'exit' },
                        ],
                    },
                ]);
                if (action === 'exit') {
                    break;
                }
                else if (action === 'progress') {
                    await showTeamProgress(agent);
                }
                continue;
            }
            // Display pending questions
            console.log(chalk_1.default.yellow(`❓ You have ${pendingQuestions.length} pending question(s):\n`));
            pendingQuestions.forEach((question, index) => {
                console.log(chalk_1.default.cyan(`${index + 1}. ${question.question}`));
                console.log(chalk_1.default.gray(`   Type: ${question.questionType}`));
                console.log(chalk_1.default.gray(`   Context: ${question.context}\n`));
            });
            const { selectedQuestion } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'selectedQuestion',
                    message: 'Which question would you like to answer?',
                    choices: [
                        ...pendingQuestions.map((q, index) => ({
                            name: `${index + 1}. ${q.question.substring(0, 80)}${q.question.length > 80 ? '...' : ''}`,
                            value: q,
                        })),
                        { name: '🔄 Refresh questions', value: 'refresh' },
                        { name: '📊 View team progress', value: 'progress' },
                        { name: '🚪 Exit', value: 'exit' },
                    ],
                },
            ]);
            if (selectedQuestion === 'exit') {
                break;
            }
            else if (selectedQuestion === 'refresh') {
                continue;
            }
            else if (selectedQuestion === 'progress') {
                await showTeamProgress(agent);
                continue;
            }
            // Answer the selected question
            await answerQuestion(agent, selectedQuestion);
        }
        catch (error) {
            console.error(chalk_1.default.red('❌ Error in chat session:'), error);
            const { continueChat } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'continueChat',
                    message: 'Would you like to continue the chat session?',
                    default: true,
                },
            ]);
            if (!continueChat) {
                break;
            }
        }
    }
    console.log(chalk_1.default.blue('👋 Chat session ended. Goodbye!\n'));
}
async function answerQuestion(agent, question) {
    console.log(chalk_1.default.yellow(`\n❓ Question: ${question.question}`));
    console.log(chalk_1.default.gray(`Context: ${question.context}\n`));
    const { answer } = await inquirer_1.default.prompt([
        {
            type: 'editor',
            name: 'answer',
            message: 'Your answer (this will open your default editor):',
            validate: (input) => input.trim().length > 0 || 'Answer is required',
        },
    ]);
    console.log(chalk_1.default.yellow('🤔 Processing your answer...\n'));
    try {
        const followUpQuestions = await agent.answerQuestion(question.id, answer);
        console.log(chalk_1.default.green('✅ Answer saved successfully!\n'));
        if (followUpQuestions.length > 0) {
            console.log(chalk_1.default.blue(`🔄 The agent has ${followUpQuestions.length} follow-up question(s):`));
            followUpQuestions.forEach((fq, index) => {
                console.log(chalk_1.default.cyan(`${index + 1}. ${fq.question}`));
            });
            console.log();
        }
        else {
            console.log(chalk_1.default.green('✨ No follow-up questions. Moving on!\n'));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error saving answer:'), error);
    }
}
async function showTeamProgress(agent) {
    console.log(chalk_1.default.blue('\n📊 Team Progress Report\n'));
    try {
        const progress = await agent.getTeamProgress(7);
        console.log(chalk_1.default.cyan('📈 Progress for the last 7 days:'));
        console.log(`${chalk_1.default.bold('Total Members:')} ${progress.totalMembers}`);
        console.log(`${chalk_1.default.bold('Total Standups:')} ${progress.totalEntries}\n`);
        if (progress.memberProgress.length > 0) {
            console.log(chalk_1.default.cyan('👥 Member Progress:'));
            progress.memberProgress.forEach((member) => {
                console.log(`${chalk_1.default.bold(member.memberName)}:`);
                console.log(`  Standups: ${member.standupCount}`);
                console.log(`  Tickets: ${member.ticketCount}`);
                console.log(`  Blockers: ${member.blockerCount}\n`);
            });
        }
        else {
            console.log(chalk_1.default.yellow('No team progress data available.\n'));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error getting team progress:'), error);
    }
}
// Handle command line execution
if (require.main === module) {
    startChatSession().catch((error) => {
        console.error(chalk_1.default.red('❌ Fatal error:'), error);
        process.exit(1);
    });
}
//# sourceMappingURL=chat-cli.js.map