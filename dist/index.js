#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const standup_cli_1 = require("./cli/standup-cli");
const chat_cli_1 = require("./cli/chat-cli");
const program = new commander_1.Command();
exports.program = program;
program
    .name('standup-tracker')
    .description('AI-powered standup tracking tool with intelligent questioning')
    .version('1.0.0');
// Add standup commands
program.addCommand(standup_cli_1.program);
// Add chat command
program
    .command('chat')
    .description('Start interactive chat session to answer agent questions')
    .action(async () => {
    try {
        await (0, chat_cli_1.startChatSession)();
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error starting chat session:'), error);
        process.exit(1);
    }
});
// Add setup command
program
    .command('setup')
    .description('Setup AWS credentials and configuration')
    .action(async () => {
    console.log(chalk_1.default.blue('🔧 Standup Tracker Setup\n'));
    console.log(chalk_1.default.yellow('Please set the following environment variables:'));
    console.log(chalk_1.default.cyan('AWS_REGION') + ' - Your AWS region (e.g., us-east-1)');
    console.log(chalk_1.default.cyan('AWS_ACCESS_KEY_ID') + ' - Your AWS access key');
    console.log(chalk_1.default.cyan('AWS_SECRET_ACCESS_KEY') + ' - Your AWS secret key');
    console.log(chalk_1.default.cyan('AWS_SESSION_TOKEN') + ' - Your AWS session token (if using temporary credentials)\n');
    console.log(chalk_1.default.yellow('Example:'));
    console.log(chalk_1.default.gray('export AWS_REGION=us-east-1'));
    console.log(chalk_1.default.gray('export AWS_ACCESS_KEY_ID=your-access-key'));
    console.log(chalk_1.default.gray('export AWS_SECRET_ACCESS_KEY=your-secret-key\n'));
    console.log(chalk_1.default.blue('💡 Tips:'));
    console.log('• Make sure your AWS credentials have access to Amazon Bedrock');
    console.log('• The tool will create a data directory to store standup information');
    console.log('• Use "standup-tracker submit" to add standup updates');
    console.log('• Use "standup-tracker chat" to answer agent questions\n');
});
// Add info command
program
    .command('info')
    .description('Show system information and status')
    .action(async () => {
    console.log(chalk_1.default.blue('ℹ️  Standup Tracker Information\n'));
    console.log(chalk_1.default.cyan('Configuration:'));
    console.log(`• AWS Region: ${process.env.AWS_REGION || 'Not set'}`);
    console.log(`• AWS Access Key: ${process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set'}`);
    console.log(`• Data Storage: Excel format`);
    console.log(`• Data Path: ./data/standup-data.xlsx\n`);
    console.log(chalk_1.default.cyan('Available Commands:'));
    console.log('• submit - Submit a standup update');
    console.log('• chat - Interactive chat with the agent');
    console.log('• progress - View team progress');
    console.log('• questions - View pending questions');
    console.log('• setup - Setup instructions');
    console.log('• info - This information\n');
});
// Handle unknown commands
program.on('command:*', () => {
    console.error(chalk_1.default.red('❌ Invalid command: %s'), program.args.join(' '));
    console.log(chalk_1.default.yellow('💡 Use --help to see available commands'));
    process.exit(1);
});
// Parse command line arguments
if (require.main === module) {
    program.parse();
}
//# sourceMappingURL=index.js.map