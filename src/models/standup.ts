export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinDate: string;
}

export interface StandupEntry {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  timestamp: string;
  summary: string;
  yesterday: string;
  today: string;
  blockers: string;
  tickets: string[];
  pullRequests: string[];
  rawNotes: string;
}

export interface AgentQuestion {
  id: string;
  entryId: string;
  question: string;
  answer?: string;
  questionType: 'incomplete_ticket' | 'unmerged_pr' | 'blocker_followup' | 'general';
  context: string;
  timestamp: string;
}

export interface StandupAnalysis {
  memberId: string;
  currentEntry: StandupEntry;
  previousEntry?: StandupEntry;
  incompleteTickets: string[];
  longRunningPRs: string[];
  recurringBlockers: string[];
  questions: AgentQuestion[];
}

export interface TeamProgress {
  date: string;
  totalMembers: number;
  completedTickets: number;
  pendingTickets: number;
  blockers: number;
  memberProgress: Record<string, {
    productivity: number;
    blockerCount: number;
    ticketCompletion: number;
  }>;
}
