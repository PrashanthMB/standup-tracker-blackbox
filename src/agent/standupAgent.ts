import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { StandupEntry, TeamMember, AgentQuestion, StandupAnalysis } from '../models/standup';
import { DataStorage } from '../utils/dataStorage';
import { BedrockService } from '../services/bedrockService';

export class StandupAgent {
  private dataStorage: DataStorage;
  private bedrockService: BedrockService;
  private maxQuestions: number;

  constructor(dataStorage: DataStorage, bedrockService: BedrockService, maxQuestions: number = 5) {
    this.dataStorage = dataStorage;
    this.bedrockService = bedrockService;
    this.maxQuestions = maxQuestions;
  }

  async processStandupEntry(rawNotes: string, memberName: string): Promise<{
    entry: StandupEntry;
    questions: AgentQuestion[];
  }> {
    // Find or create team member
    const member = await this.findOrCreateMember(memberName);
    
    // Parse the standup notes
    const entry = await this.parseStandupNotes(rawNotes, member);
    
    // Save the entry
    await this.saveStandupEntry(entry);
    
    // Analyze and generate questions
    const analysis = await this.analyzeStandupEntry(entry);
    const questions = await this.bedrockService.analyzeStandup(analysis);
    
    // Save questions
    if (questions.length > 0) {
      await this.saveQuestions(questions);
    }
    
    return { entry, questions };
  }

  async answerQuestion(questionId: string, answer: string): Promise<AgentQuestion[]> {
    const questions = await this.dataStorage.loadAgentQuestions();
    const question = questions.find(q => q.id === questionId);
    
    if (!question) {
      throw new Error('Question not found');
    }
    
    // Update the question with the answer
    question.answer = answer;
    question.timestamp = new Date().toISOString();
    
    // Save updated questions
    await this.dataStorage.saveAgentQuestions(questions);
    
    // Generate follow-up questions if needed
    const entries = await this.dataStorage.getEntriesByMember(
      this.extractMemberIdFromEntry(question.entryId), 
      7
    );
    
    const followUpQuestions = await this.bedrockService.generateFollowUpQuestions(
      question, 
      answer, 
      entries
    );
    
    if (followUpQuestions.length > 0) {
      await this.saveQuestions(followUpQuestions);
    }
    
    return followUpQuestions;
  }

  private async findOrCreateMember(memberName: string): Promise<TeamMember> {
    const members = await this.dataStorage.loadTeamMembers();
    let member = members.find(m => m.name.toLowerCase() === memberName.toLowerCase());
    
    if (!member) {
      member = {
        id: uuidv4(),
        name: memberName,
        email: `${memberName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
        role: 'Developer',
        joinDate: new Date().toISOString().split('T')[0],
      };
      
      members.push(member);
      await this.dataStorage.saveTeamMembers(members);
    }
    
    return member;
  }

  private async parseStandupNotes(rawNotes: string, member: TeamMember): Promise<StandupEntry> {
    const entry: StandupEntry = {
      id: uuidv4(),
      memberId: member.id,
      memberName: member.name,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      summary: '',
      yesterday: '',
      today: '',
      blockers: '',
      tickets: [],
      pullRequests: [],
      rawNotes,
    };

    // Parse structured content from raw notes
    const lines = rawNotes.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentSection = '';
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('yesterday') || lowerLine.includes('completed') || lowerLine.includes('done')) {
        currentSection = 'yesterday';
        entry.yesterday += line.replace(/^(yesterday|completed|done):?\s*/i, '') + ' ';
      } else if (lowerLine.includes('today') || lowerLine.includes('working') || lowerLine.includes('plan')) {
        currentSection = 'today';
        entry.today += line.replace(/^(today|working|plan):?\s*/i, '') + ' ';
      } else if (lowerLine.includes('blocker') || lowerLine.includes('blocked') || lowerLine.includes('issue')) {
        currentSection = 'blockers';
        entry.blockers += line.replace(/^(blocker|blocked|issue):?\s*/i, '') + ' ';
      } else {
        // Continue adding to current section
        switch (currentSection) {
          case 'yesterday':
            entry.yesterday += line + ' ';
            break;
          case 'today':
            entry.today += line + ' ';
            break;
          case 'blockers':
            entry.blockers += line + ' ';
            break;
          default:
            entry.summary += line + ' ';
        }
      }
      
      // Extract tickets (THM-1234, JIRA-567, etc.)
      const ticketMatches = line.match(/\b[A-Z]{2,}-\d+\b/g);
      if (ticketMatches) {
        entry.tickets.push(...ticketMatches);
      }
      
      // Extract PR references
      const prMatches = line.match(/\b(PR|pull request|merge request)\s*#?\d+\b/gi);
      if (prMatches) {
        entry.pullRequests.push(...prMatches);
      }
    }
    
    // Clean up fields
    entry.yesterday = entry.yesterday.trim();
    entry.today = entry.today.trim();
    entry.blockers = entry.blockers.trim();
    entry.summary = entry.summary.trim() || this.generateSummary(entry);
    entry.tickets = [...new Set(entry.tickets)]; // Remove duplicates
    entry.pullRequests = [...new Set(entry.pullRequests)];
    
    return entry;
  }

  private generateSummary(entry: StandupEntry): string {
    const parts = [];
    if (entry.yesterday) parts.push(`Completed: ${entry.yesterday.substring(0, 50)}...`);
    if (entry.today) parts.push(`Working on: ${entry.today.substring(0, 50)}...`);
    if (entry.blockers) parts.push(`Blocked by: ${entry.blockers.substring(0, 30)}...`);
    return parts.join(' | ') || 'Standup update';
  }

  private async analyzeStandupEntry(currentEntry: StandupEntry): Promise<StandupAnalysis> {
    const previousEntries = await this.dataStorage.getEntriesByMember(currentEntry.memberId, 7);
    const previousEntry = previousEntries.find(e => e.id !== currentEntry.id);
    
    const analysis: StandupAnalysis = {
      memberId: currentEntry.memberId,
      currentEntry,
      previousEntry,
      incompleteTickets: [],
      longRunningPRs: [],
      recurringBlockers: [],
      questions: [],
    };
    
    // Find incomplete tickets
    if (previousEntry) {
      const previousTickets = new Set(previousEntry.tickets);
      const currentTickets = new Set(currentEntry.tickets);
      
      // Tickets mentioned in previous "today" but not in current "yesterday"
      const plannedTickets = this.extractTicketsFromText(previousEntry.today);
      const completedTickets = this.extractTicketsFromText(currentEntry.yesterday);
      
      analysis.incompleteTickets = plannedTickets.filter(ticket => !completedTickets.includes(ticket));
    }
    
    // Find long-running PRs
    const allEntries = await this.dataStorage.getEntriesByMember(currentEntry.memberId, 7);
    const prCounts = new Map<string, number>();
    
    if (allEntries && allEntries.length > 0) {
      allEntries.forEach(entry => {
        if (entry.pullRequests && entry.pullRequests.length > 0) {
          entry.pullRequests.forEach(pr => {
            prCounts.set(pr, (prCounts.get(pr) || 0) + 1);
          });
        }
      });
    }
    
    analysis.longRunningPRs = Array.from(prCounts.entries())
      .filter(([_, count]) => count >= 3)
      .map(([pr, _]) => pr);
    
    return analysis;
  }

  private extractTicketsFromText(text: string): string[] {
    const matches = text.match(/\b[A-Z]{2,}-\d+\b/g);
    return matches || [];
  }

  async saveStandupEntry(entry: StandupEntry): Promise<void> {
    const entries = (await this.dataStorage.loadStandupEntries()) || [];
    entries.push(entry);
    await this.dataStorage.saveStandupEntries(entries);
  }

  private async saveQuestions(questions: AgentQuestion[]): Promise<void> {
    const existingQuestions = (await this.dataStorage.loadAgentQuestions()) || [];
    existingQuestions.push(...questions);
    await this.dataStorage.saveAgentQuestions(existingQuestions);
  }

  private extractMemberIdFromEntry(entryId: string): string {
    // This is a simplified approach - in a real implementation,
    // you'd want to store this relationship more explicitly
    return entryId.split('-')[0] || '';
  }

  async getPendingQuestions(memberId?: string): Promise<AgentQuestion[]> {
    const questions = await this.dataStorage.loadAgentQuestions();
    return questions.filter(q => !q.answer && (!memberId || this.extractMemberIdFromEntry(q.entryId) === memberId));
  }

  async getTeamProgress(days: number = 7): Promise<any> {
    const entries = await this.dataStorage.loadStandupEntries();
    const cutoffDate = moment().subtract(days, 'days').toDate();
    
    const recentEntries = (entries || []).filter(entry => new Date(entry.date) >= cutoffDate);
    
    const memberStats = new Map();
    
    recentEntries.forEach(entry => {
      if (!memberStats.has(entry.memberId)) {
        memberStats.set(entry.memberId, {
          name: entry.memberName,
          entries: 0,
          tickets: new Set(),
          blockers: 0,
        });
      }
      
      const stats = memberStats.get(entry.memberId);
      stats.entries++;
      if (entry.tickets && entry.tickets.length > 0) {
        entry.tickets.forEach(ticket => stats.tickets.add(ticket));
      }
      if (entry.blockers) stats.blockers++;
    });
    
    return {
      totalMembers: memberStats.size,
      totalEntries: recentEntries.length,
      memberProgress: Array.from(memberStats.entries()).map(([id, stats]) => ({
        memberId: id,
        memberName: stats.name,
        standupCount: stats.entries,
        ticketCount: stats.tickets.size,
        blockerCount: stats.blockers,
      })),
    };
  }
}
