#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { program as standupProgram } from './cli/standup-cli';
import { startChatSession } from './cli/chat-cli';

const program = new Command();

program
  .name('standup-tracker')
  .description('AI-powered standup tracking tool with intelligent questioning')
  .version('1.0.0');

// Add standup commands
program.addCommand(standupProgram);

// Add chat command
program
  .command('chat')
  .description('Start interactive chat session to answer agent questions')
  .action(async () => {
    try {
      await startChatSession();
    } catch (error) {
      console.error(chalk.red('❌ Error starting chat session:'), error);
      process.exit(1);
    }
  });

// Add setup command
program
  .command('setup')
  .description('Setup AWS credentials and configuration')
  .action(async () => {
    console.log(chalk.blue('🔧 Standup Tracker Setup\n'));
    
    console.log(chalk.yellow('Please set the following environment variables:'));
    console.log(chalk.cyan('AWS_REGION') + ' - Your AWS region (e.g., us-east-1)');
    console.log(chalk.cyan('AWS_ACCESS_KEY_ID') + ' - Your AWS access key');
    console.log(chalk.cyan('AWS_SECRET_ACCESS_KEY') + ' - Your AWS secret key');
    console.log(chalk.cyan('AWS_SESSION_TOKEN') + ' - Your AWS session token (if using temporary credentials)\n');
    
    console.log(chalk.yellow('Example:'));
    console.log(chalk.gray('export AWS_REGION=us-east-1'));
    console.log(chalk.gray('export AWS_ACCESS_KEY_ID=your-access-key'));
    console.log(chalk.gray('export AWS_SECRET_ACCESS_KEY=your-secret-key\n'));
    
    console.log(chalk.blue('💡 Tips:'));
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
    console.log(chalk.blue('ℹ️  Standup Tracker Information\n'));
    
    console.log(chalk.cyan('Configuration:'));
    console.log(`• AWS Region: ${process.env.AWS_REGION || 'Not set'}`);
    console.log(`• AWS Access Key: ${process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set'}`);
    console.log(`• Data Storage: Excel format`);
    console.log(`• Data Path: ./data/standup-data.xlsx\n`);
    
    console.log(chalk.cyan('Available Commands:'));
    console.log('• submit - Submit a standup update');
    console.log('• chat - Interactive chat with the agent');
    console.log('• progress - View team progress');
    console.log('• questions - View pending questions');
    console.log('• setup - Setup instructions');
    console.log('• info - This information\n');
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('❌ Invalid command: %s'), program.args.join(' '));
  console.log(chalk.yellow('💡 Use --help to see available commands'));
  process.exit(1);
});

// Parse command line arguments
if (require.main === module) {
  program.parse();
}

export { program };
