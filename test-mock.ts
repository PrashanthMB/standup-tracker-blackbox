#!/usr/bin/env node

import { DataStorage } from './src/utils/dataStorage';
import { StandupAgent } from './src/agent/standupAgent';
import { BedrockService } from './src/services/bedrockService';
import { defaultConfig } from './src/config/config';
import chalk from 'chalk';

// Mock Bedrock service for testing without AWS credentials
class MockBedrockService extends BedrockService {
  constructor() {
    super({
      region: 'us-east-1',
      modelId: 'mock-model',
    });
  }

  async analyzeStandup(analysis: any): Promise<any[]> {
    console.log(chalk.yellow('🤖 Mock AI Analysis (AWS credentials not configured)'));
    
    // Generate mock questions based on the analysis
    const questions = [];
    
    if (analysis.incompleteTickets.length > 0) {
      questions.push({
        id: 'mock-1',
        entryId: analysis.currentEntry.id,
        question: `Why wasn't ticket ${analysis.incompleteTickets[0]} completed as planned yesterday?`,
        questionType: 'incomplete_ticket',
        context: `Ticket ${analysis.incompleteTickets[0]} was mentioned in yesterday's plan but not in today's completed work`,
        timestamp: new Date().toISOString(),
      });
    }
    
    if (analysis.currentEntry.blockers) {
      questions.push({
        id: 'mock-2',
        entryId: analysis.currentEntry.id,
        question: 'What steps are you taking to resolve the current blockers?',
        questionType: 'blocker_followup',
        context: 'You mentioned blockers in your standup',
        timestamp: new Date().toISOString(),
      });
    }
    
    return questions;
  }

  async generateFollowUpQuestions(): Promise<any[]> {
    return [];
  }
}

async function testStandupTracker() {
  console.log(chalk.blue('🧪 Testing Standup Tracker (Mock Mode)\n'));
  
  try {
    // Initialize with mock service
    const dataStorage = new DataStorage(
      './data/test-standup-data.xlsx',
      './data/test-backup/',
      'excel'
    );
    
    const mockBedrockService = new MockBedrockService();
    const agent = new StandupAgent(dataStorage, mockBedrockService, 5);
    
    // Test standup entry processing
    const sampleNotes = `Yesterday:
- Completed ticket THM-1234: Fixed user authentication bug
- Merged PR #123 for login improvements

Today:
- Working on THM-1235: Password reset functionality
- Planning to start THM-1236: Email verification

Blockers:
- Waiting for API documentation from backend team`;
    
    console.log(chalk.cyan('📝 Processing sample standup entry...'));
    const result = await agent.processStandupEntry(sampleNotes, 'John Doe');
    
    console.log(chalk.green('✅ Entry processed successfully!\n'));
    
    // Display parsed information
    console.log(chalk.cyan('📋 Parsed Information:'));
    console.log(`Member: ${result.entry.memberName}`);
    console.log(`Date: ${result.entry.date}`);
    console.log(`Yesterday: ${result.entry.yesterday}`);
    console.log(`Today: ${result.entry.today}`);
    console.log(`Blockers: ${result.entry.blockers}`);
    console.log(`Tickets: ${result.entry.tickets.join(', ')}`);
    console.log(`PRs: ${result.entry.pullRequests.join(', ')}\n`);
    
    // Display questions
    if (result.questions.length > 0) {
      console.log(chalk.yellow(`❓ Generated ${result.questions.length} question(s):`));
      result.questions.forEach((q, index) => {
        console.log(`${index + 1}. ${q.question}`);
        console.log(`   Type: ${q.questionType}`);
        console.log(`   Context: ${q.context}\n`);
      });
    }
    
    // Test progress tracking
    console.log(chalk.cyan('📊 Testing progress tracking...'));
    const progress = await agent.getTeamProgress(7);
    console.log(`Total members: ${progress.totalMembers}`);
    console.log(`Total entries: ${progress.totalEntries}\n`);
    
    console.log(chalk.green('🎉 All tests passed! The standup tracker is working correctly.'));
    console.log(chalk.blue('💡 To use with real AI, configure your AWS Bedrock credentials.\n'));
    
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error);
    process.exit(1);
  }
}

testStandupTracker();
