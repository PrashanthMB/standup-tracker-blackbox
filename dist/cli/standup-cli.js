#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const standupAgent_1 = require("../agent/standupAgent");
const dataStorage_1 = require("../utils/dataStorage");
const bedrockService_1 = require("../services/bedrockService");
const config_1 = require("../config/config");
const program = new commander_1.Command();
exports.program = program;
async function initializeAgent() {
    const dataStorage = new dataStorage_1.DataStorage(config_1.defaultConfig.dataStorage.filePath, config_1.defaultConfig.dataStorage.backupPath, config_1.defaultConfig.dataStorage.type);
    const bedrockService = new bedrockService_1.BedrockService(config_1.defaultConfig.bedrock);
    return new standupAgent_1.StandupAgent(dataStorage, bedrockService, config_1.defaultConfig.agent.maxQuestions);
}
program
    .name('standup-tracker')
    .description('AI-powered standup tracking tool')
    .version('1.0.0');
program
    .command('submit')
    .description('Submit a standup update')
    .option('-m, --member <name>', 'Team member name')
    .option('-n, --notes <notes>', 'Standup notes')
    .option('-f, --file <path>', 'Read notes from file')
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('🚀 Standup Tracker - Submit Update\n'));
        let memberName = options.member;
        let notes = options.notes;
        // Get member name if not provided
        if (!memberName) {
            const memberAnswer = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'memberName',
                    message: 'Enter your name:',
                    validate: (input) => input.trim().length > 0 || 'Name is required',
                },
            ]);
            memberName = memberAnswer.memberName;
        }
        // Get notes if not provided
        if (!notes && !options.file) {
            const notesAnswer = await inquirer_1.default.prompt([
                {
                    type: 'editor',
                    name: 'notes',
                    message: 'Enter your standup notes (this will open your default editor):',
                    validate: (input) => input.trim().length > 0 || 'Notes are required',
                },
            ]);
            notes = notesAnswer.notes;
        }
        else if (options.file) {
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            notes = fs.readFileSync(options.file, 'utf8');
        }
        console.log(chalk_1.default.yellow('📝 Processing your standup update...\n'));
        const agent = await initializeAgent();
        const result = await agent.processStandupEntry(notes, memberName);
        console.log(chalk_1.default.green('✅ Standup update saved successfully!\n'));
        // Display parsed information
        console.log(chalk_1.default.cyan('📋 Parsed Information:'));
        console.log(`${chalk_1.default.bold('Member:')} ${result.entry.memberName}`);
        console.log(`${chalk_1.default.bold('Date:')} ${result.entry.date}`);
        console.log(`${chalk_1.default.bold('Yesterday:')} ${result.entry.yesterday || 'Not specified'}`);
        console.log(`${chalk_1.default.bold('Today:')} ${result.entry.today || 'Not specified'}`);
        console.log(`${chalk_1.default.bold('Blockers:')} ${result.entry.blockers || 'None'}`);
        console.log(`${chalk_1.default.bold('Tickets:')} ${result.entry.tickets.join(', ') || 'None'}`);
        console.log(`${chalk_1.default.bold('PRs:')} ${result.entry.pullRequests.join(', ') || 'None'}\n`);
        // Display questions if any
        if (result.questions.length > 0) {
            console.log(chalk_1.default.red('❓ The agent has some questions for you:\n'));
            for (const question of result.questions) {
                console.log(chalk_1.default.yellow(`Q: ${question.question}`));
                console.log(chalk_1.default.gray(`   Context: ${question.context}\n`));
            }
            console.log(chalk_1.default.blue('💡 Use "standup-tracker chat" to answer these questions.\n'));
        }
        else {
            console.log(chalk_1.default.green('✨ No questions from the agent. Great update!\n'));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error processing standup:'), error);
        process.exit(1);
    }
});
program
    .command('progress')
    .description('View team progress')
    .option('-d, --days <number>', 'Number of days to analyze', '7')
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('📊 Team Progress Report\n'));
        const agent = await initializeAgent();
        const progress = await agent.getTeamProgress(parseInt(options.days));
        console.log(chalk_1.default.cyan(`📈 Progress for the last ${options.days} days:`));
        console.log(`${chalk_1.default.bold('Total Members:')} ${progress.totalMembers}`);
        console.log(`${chalk_1.default.bold('Total Standups:')} ${progress.totalEntries}\n`);
        console.log(chalk_1.default.cyan('👥 Member Progress:'));
        progress.memberProgress.forEach((member) => {
            console.log(`${chalk_1.default.bold(member.memberName)}:`);
            console.log(`  Standups: ${member.standupCount}`);
            console.log(`  Tickets: ${member.ticketCount}`);
            console.log(`  Blockers: ${member.blockerCount}\n`);
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error getting progress:'), error);
        process.exit(1);
    }
});
program
    .command('questions')
    .description('View pending questions')
    .option('-m, --member <name>', 'Filter by member name')
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('❓ Pending Questions\n'));
        const agent = await initializeAgent();
        const questions = await agent.getPendingQuestions();
        if (questions.length === 0) {
            console.log(chalk_1.default.green('✨ No pending questions!\n'));
            return;
        }
        questions.forEach((question, index) => {
            console.log(chalk_1.default.yellow(`${index + 1}. ${question.question}`));
            console.log(chalk_1.default.gray(`   ID: ${question.id}`));
            console.log(chalk_1.default.gray(`   Type: ${question.questionType}`));
            console.log(chalk_1.default.gray(`   Context: ${question.context}\n`));
        });
        console.log(chalk_1.default.blue('💡 Use "standup-tracker chat" to answer these questions.\n'));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error getting questions:'), error);
        process.exit(1);
    }
});
if (require.main === module) {
    program.parse();
}
//# sourceMappingURL=standup-cli.js.map