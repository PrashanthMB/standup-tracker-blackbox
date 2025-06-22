#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { StandupAgent } from '../agent/standupAgent';
import { DataStorage } from '../utils/dataStorage';
import { BedrockService } from '../services/bedrockService';
import { defaultConfig } from '../config/config';

const program = new Command();

async function initializeAgent(): Promise<StandupAgent> {
  const dataStorage = new DataStorage(
    defaultConfig.dataStorage.filePath,
    defaultConfig.dataStorage.backupPath,
    defaultConfig.dataStorage.type
  );
  
  const bedrockService = new BedrockService(defaultConfig.bedrock);
  
  return new StandupAgent(
    dataStorage,
    bedrockService,
    defaultConfig.agent.maxQuestions
  );
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
      console.log(chalk.blue('🚀 Standup Tracker - Submit Update\n'));
      
      let memberName = options.member;
      let notes = options.notes;
      
      // Get member name if not provided
      if (!memberName) {
        const memberAnswer = await inquirer.prompt([
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
        const notesAnswer = await inquirer.prompt([
          {
            type: 'editor',
            name: 'notes',
            message: 'Enter your standup notes (this will open your default editor):',
            validate: (input) => input.trim().length > 0 || 'Notes are required',
          },
        ]);
        notes = notesAnswer.notes;
      } else if (options.file) {
        const fs = await import('fs');
        notes = fs.readFileSync(options.file, 'utf8');
      }
      
      console.log(chalk.yellow('📝 Processing your standup update...\n'));
      
      const agent = await initializeAgent();
      const result = await agent.processStandupEntry(notes, memberName);
      
      console.log(chalk.green('✅ Standup update saved successfully!\n'));
      
      // Display parsed information
      console.log(chalk.cyan('📋 Parsed Information:'));
      console.log(`${chalk.bold('Member:')} ${result.entry.memberName}`);
      console.log(`${chalk.bold('Date:')} ${result.entry.date}`);
      console.log(`${chalk.bold('Yesterday:')} ${result.entry.yesterday || 'Not specified'}`);
      console.log(`${chalk.bold('Today:')} ${result.entry.today || 'Not specified'}`);
      console.log(`${chalk.bold('Blockers:')} ${result.entry.blockers || 'None'}`);
      console.log(`${chalk.bold('Tickets:')} ${result.entry.tickets.join(', ') || 'None'}`);
      console.log(`${chalk.bold('PRs:')} ${result.entry.pullRequests.join(', ') || 'None'}\n`);
      
      // Display questions if any
      if (result.questions.length > 0) {
        console.log(chalk.red('❓ The agent has some questions for you:\n'));
        
        for (const question of result.questions) {
          console.log(chalk.yellow(`Q: ${question.question}`));
          console.log(chalk.gray(`   Context: ${question.context}\n`));
        }
        
        console.log(chalk.blue('💡 Use "standup-tracker chat" to answer these questions.\n'));
      } else {
        console.log(chalk.green('✨ No questions from the agent. Great update!\n'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error processing standup:'), error);
      process.exit(1);
    }
  });

program
  .command('progress')
  .description('View team progress')
  .option('-d, --days <number>', 'Number of days to analyze', '7')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📊 Team Progress Report\n'));
      
      const agent = await initializeAgent();
      const progress = await agent.getTeamProgress(parseInt(options.days));
      
      console.log(chalk.cyan(`📈 Progress for the last ${options.days} days:`));
      console.log(`${chalk.bold('Total Members:')} ${progress.totalMembers}`);
      console.log(`${chalk.bold('Total Standups:')} ${progress.totalEntries}\n`);
      
      console.log(chalk.cyan('👥 Member Progress:'));
      progress.memberProgress.forEach((member: any) => {
        console.log(`${chalk.bold(member.memberName)}:`);
        console.log(`  Standups: ${member.standupCount}`);
        console.log(`  Tickets: ${member.ticketCount}`);
        console.log(`  Blockers: ${member.blockerCount}\n`);
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Error getting progress:'), error);
      process.exit(1);
    }
  });

program
  .command('questions')
  .description('View pending questions')
  .option('-m, --member <name>', 'Filter by member name')
  .action(async (options) => {
    try {
      console.log(chalk.blue('❓ Pending Questions\n'));
      
      const agent = await initializeAgent();
      const questions = await agent.getPendingQuestions();
      
      if (questions.length === 0) {
        console.log(chalk.green('✨ No pending questions!\n'));
        return;
      }
      
      questions.forEach((question, index) => {
        console.log(chalk.yellow(`${index + 1}. ${question.question}`));
        console.log(chalk.gray(`   ID: ${question.id}`));
        console.log(chalk.gray(`   Type: ${question.questionType}`));
        console.log(chalk.gray(`   Context: ${question.context}\n`));
      });
      
      console.log(chalk.blue('💡 Use "standup-tracker chat" to answer these questions.\n'));
      
    } catch (error) {
      console.error(chalk.red('❌ Error getting questions:'), error);
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

export { program };
