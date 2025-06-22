import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { StandupEntry, TeamMember, AgentQuestion } from '../models/standup';

export class DataStorage {
  private filePath: string;
  private backupPath: string;
  private storageType: 'excel' | 'json';

  constructor(filePath: string, backupPath: string, storageType: 'excel' | 'json' = 'excel') {
    this.filePath = filePath;
    this.backupPath = backupPath;
    this.storageType = storageType;
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  private createBackup(): void {
    if (fs.existsSync(this.filePath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupPath, `backup-${timestamp}${path.extname(this.filePath)}`);
      fs.copyFileSync(this.filePath, backupFile);
    }
  }

  async saveStandupEntries(entries: StandupEntry[]): Promise<void> {
    this.createBackup();
    
    if (this.storageType === 'excel') {
      await this.saveToExcel('StandupEntries', entries);
    } else {
      await this.saveToJson('standupEntries', entries);
    }
  }

  async loadStandupEntries(): Promise<StandupEntry[]> {
    if (this.storageType === 'excel') {
      return await this.loadFromExcel('StandupEntries');
    } else {
      return await this.loadFromJson('standupEntries');
    }
  }

  async saveTeamMembers(members: TeamMember[]): Promise<void> {
    if (this.storageType === 'excel') {
      await this.saveToExcel('TeamMembers', members);
    } else {
      await this.saveToJson('teamMembers', members);
    }
  }

  async loadTeamMembers(): Promise<TeamMember[]> {
    if (this.storageType === 'excel') {
      return await this.loadFromExcel('TeamMembers');
    } else {
      return await this.loadFromJson('teamMembers');
    }
  }

  async saveAgentQuestions(questions: AgentQuestion[]): Promise<void> {
    if (this.storageType === 'excel') {
      await this.saveToExcel('AgentQuestions', questions);
    } else {
      await this.saveToJson('agentQuestions', questions);
    }
  }

  async loadAgentQuestions(): Promise<AgentQuestion[]> {
    if (this.storageType === 'excel') {
      return await this.loadFromExcel('AgentQuestions');
    } else {
      return await this.loadFromJson('agentQuestions');
    }
  }

  private async saveToExcel(sheetName: string, data: any[]): Promise<void> {
    let workbook: XLSX.WorkBook;
    
    if (fs.existsSync(this.filePath)) {
      workbook = XLSX.readFile(this.filePath);
    } else {
      workbook = XLSX.utils.book_new();
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    if (workbook.Sheets[sheetName]) {
      workbook.Sheets[sheetName] = worksheet;
    } else {
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    XLSX.writeFile(workbook, this.filePath);
  }

  private async loadFromExcel(sheetName: string): Promise<any[]> {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }

    const workbook = XLSX.readFile(this.filePath);
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      return [];
    }

    return XLSX.utils.sheet_to_json(worksheet);
  }

  private async saveToJson(key: string, data: any[]): Promise<void> {
    let jsonData: any = {};
    
    if (fs.existsSync(this.filePath)) {
      const fileContent = fs.readFileSync(this.filePath, 'utf8');
      jsonData = JSON.parse(fileContent);
    }

    jsonData[key] = data;
    fs.writeFileSync(this.filePath, JSON.stringify(jsonData, null, 2));
  }

  private async loadFromJson(key: string): Promise<any[]> {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }

    const fileContent = fs.readFileSync(this.filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    return jsonData[key] || [];
  }

  async getEntriesByMember(memberId: string, days: number = 7): Promise<StandupEntry[]> {
    const entries = await this.loadStandupEntries();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return entries
      .filter(entry => entry.memberId === memberId && new Date(entry.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getLatestEntryByMember(memberId: string): Promise<StandupEntry | undefined> {
    const entries = await this.getEntriesByMember(memberId, 1);
    return entries[0];
  }
}
