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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStorage = void 0;
const XLSX = __importStar(require("xlsx"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DataStorage {
    constructor(filePath, backupPath, storageType = 'excel') {
        this.filePath = filePath;
        this.backupPath = backupPath;
        this.storageType = storageType;
        this.ensureDirectories();
    }
    ensureDirectories() {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }
    }
    createBackup() {
        if (fs.existsSync(this.filePath)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.backupPath, `backup-${timestamp}${path.extname(this.filePath)}`);
            fs.copyFileSync(this.filePath, backupFile);
        }
    }
    async saveStandupEntries(entries) {
        this.createBackup();
        if (this.storageType === 'excel') {
            await this.saveToExcel('StandupEntries', entries);
        }
        else {
            await this.saveToJson('standupEntries', entries);
        }
    }
    async loadStandupEntries() {
        if (this.storageType === 'excel') {
            return await this.loadFromExcel('StandupEntries');
        }
        else {
            return await this.loadFromJson('standupEntries');
        }
    }
    async saveTeamMembers(members) {
        if (this.storageType === 'excel') {
            await this.saveToExcel('TeamMembers', members);
        }
        else {
            await this.saveToJson('teamMembers', members);
        }
    }
    async loadTeamMembers() {
        if (this.storageType === 'excel') {
            return await this.loadFromExcel('TeamMembers');
        }
        else {
            return await this.loadFromJson('teamMembers');
        }
    }
    async saveAgentQuestions(questions) {
        if (this.storageType === 'excel') {
            await this.saveToExcel('AgentQuestions', questions);
        }
        else {
            await this.saveToJson('agentQuestions', questions);
        }
    }
    async loadAgentQuestions() {
        if (this.storageType === 'excel') {
            return await this.loadFromExcel('AgentQuestions');
        }
        else {
            return await this.loadFromJson('agentQuestions');
        }
    }
    async saveToExcel(sheetName, data) {
        let workbook;
        if (fs.existsSync(this.filePath)) {
            workbook = XLSX.readFile(this.filePath);
        }
        else {
            workbook = XLSX.utils.book_new();
        }
        const worksheet = XLSX.utils.json_to_sheet(data);
        if (workbook.Sheets[sheetName]) {
            workbook.Sheets[sheetName] = worksheet;
        }
        else {
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
        XLSX.writeFile(workbook, this.filePath);
    }
    async loadFromExcel(sheetName) {
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
    async saveToJson(key, data) {
        let jsonData = {};
        if (fs.existsSync(this.filePath)) {
            const fileContent = fs.readFileSync(this.filePath, 'utf8');
            jsonData = JSON.parse(fileContent);
        }
        jsonData[key] = data;
        fs.writeFileSync(this.filePath, JSON.stringify(jsonData, null, 2));
    }
    async loadFromJson(key) {
        if (!fs.existsSync(this.filePath)) {
            return [];
        }
        const fileContent = fs.readFileSync(this.filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);
        return jsonData[key] || [];
    }
    async getEntriesByMember(memberId, days = 7) {
        const entries = await this.loadStandupEntries();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return entries
            .filter(entry => entry.memberId === memberId && new Date(entry.date) >= cutoffDate)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    async getLatestEntryByMember(memberId) {
        const entries = await this.getEntriesByMember(memberId, 1);
        return entries[0];
    }
}
exports.DataStorage = DataStorage;
//# sourceMappingURL=dataStorage.js.map