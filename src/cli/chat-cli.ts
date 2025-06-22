#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import { StandupAgent } from '../agent/standupAgent';
import { DataStorage } from '../utils/dataStorage';
import { BedrockService } from '../services/bedrockService';
import { defaultConfig } from '../config/config';
import { AgentQuestion } from '../models/standup';

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

async function startChatSession() {
  console.log(chalk.blue('💬 Standup Agent Chat Session'));
  console.log(chalk.gray('Type "exit" to quit, "help" for commands\n'));
  
  const agent = await initializeAgent();
  
  while (true) {
    try {
      const pendingQuestions = await agent.getPendingQuestions();
      
      if (pendingQuestions.length === 0) {
        console.log(chalk.green('✨ No pending questions! You\'re all caught up.\n'));
        
        const { action } = await inquirer.prompt([
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
        } else if (action === 'progress') {
          await showTeamProgress(agent);
        }
        continue;
      }
      
      // Display pending questions
      console.log(chalk.yellow(`❓ You have ${pendingQuestions.length} pending question(s):\n`));
      
      pendingQuestions.forEach((question, index) => {
        console.log(chalk.cyan(`${index + 1}. ${question.question}`));
        console.log(chalk.gray(`   Type: ${question.questionType}`));
        console.log(chalk.gray(`   Context: ${question.context}\n`));
      });
      
      const { selectedQuestion } = await inquirer.prompt([
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
      } else if (selectedQuestion === 'refresh') {
        continue;
      } else if (selectedQuestion === 'progress') {
        await showTeamProgress(agent);
        continue;
      }
      
      // Answer the selected question
      await answerQuestion(agent, selectedQuestion);
      
    } catch (error) {
      console.error(chalk.red('❌ Error in chat session:'), error);
      
      const { continueChat } = await inquirer.prompt([
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
  
  console.log(chalk.blue('👋 Chat session ended. Goodbye!\n'));
}

async function answerQuestion(agent: StandupAgent, question: AgentQuestion) {
  console.log(chalk.yellow(`\n❓ Question: ${question.question}`));
  console.log(chalk.gray(`Context: ${question.context}\n`));
  
  const { answer } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'answer',
      message: 'Your answer (this will open your default editor):',
      validate: (input) => input.trim().length > 0 || 'Answer is required',
    },
  ]);
  
  console.log(chalk.yellow('🤔 Processing your answer...\n'));
  
  try {
    const followUpQuestions = await agent.answerQuestion(question.id, answer);
    
    console.log(chalk.green('✅ Answer saved successfully!\n'));
    
    if (followUpQuestions.length > 0) {
      console.log(chalk.blue(`🔄 The agent has ${followUpQuestions.length} follow-up question(s):`));
      followUpQuestions.forEach((fq, index) => {
        console.log(chalk.cyan(`${index + 1}. ${fq.question}`));
      });
      console.log();
    } else {
      console.log(chalk.green('✨ No follow-up questions. Moving on!\n'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error saving answer:'), error);
  }
}

async function showTeamProgress(agent: StandupAgent) {
  console.log(chalk.blue('\n📊 Team Progress Report\n'));
  
  try {
    const progress = await agent.getTeamProgress(7);
    
    console.log(chalk.cyan('📈 Progress for the last 7 days:'));
    console.log(`${chalk.bold('Total Members:')} ${progress.totalMembers}`);
    console.log(`${chalk.bold('Total Standups:')} ${progress.totalEntries}\n`);
    
    if (progress.memberProgress.length > 0) {
      console.log(chalk.cyan('👥 Member Progress:'));
      progress.memberProgress.forEach((member: any) => {
        console.log(`${chalk.bold(member.memberName)}:`);
        console.log(`  Standups: ${member.standupCount}`);
        console.log(`  Tickets: ${member.ticketCount}`);
        console.log(`  Blockers: ${member.blockerCount}\n`);
      });
    } else {
      console.log(chalk.yellow('No team progress data available.\n'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error getting team progress:'), error);
  }
}

// Handle command line execution
if (require.main === module) {
  startChatSession().catch((error) => {
    console.error(chalk.red('❌ Fatal error:'), error);
    process.exit(1);
  });
}

export { startChatSession };
