# Standup Tracker Agent

An AI-powered tool for tracking team standup updates with intelligent questioning capabilities using Amazon Bedrock.

## Features

- 🤖 **AI-Powered Analysis**: Uses Amazon Bedrock (Claude) to analyze standup updates and generate intelligent questions
- 📊 **Excel/JSON Storage**: Stores data in Excel or JSON format with automatic backups
- ❓ **Smart Questioning**: Asks follow-up questions about incomplete tickets, unmerged PRs, and blockers
- 💬 **Interactive Chat**: Terminal-based chat interface for answering agent questions
- 📈 **Progress Tracking**: View team progress and productivity metrics
- 🔄 **Context Awareness**: Compares current updates with previous entries to identify inconsistencies

## Prerequisites

- Node.js 18+ and npm
- AWS account with Bedrock access
- AWS credentials configured

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd standup-tracker-agent
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Set up AWS credentials:
```bash
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
# Optional: for temporary credentials
export AWS_SESSION_TOKEN=your-session-token
```

## Usage

### Setup
```bash
npm run dev setup
```

### Submit a Standup Update
```bash
# Interactive mode
npm run standup submit

# With parameters
npm run standup submit -m "John Doe" -n "Yesterday: Fixed bug THM-1234. Today: Working on THM-1235. Blockers: None"

# From file
npm run standup submit -m "John Doe" -f standup-notes.txt
```

### Interactive Chat with Agent
```bash
npm run chat
```

### View Team Progress
```bash
npm run standup progress
npm run standup progress -d 14  # Last 14 days
```

### View Pending Questions
```bash
npm run standup questions
```

## Standup Note Format

The agent can parse various formats, but works best with structured notes:

```
Yesterday:
- Completed ticket THM-1234: User authentication bug fix
- Merged PR #123 for login improvements

Today:
- Working on THM-1235: Password reset functionality
- Code review for team member's PR #124

Blockers:
- Waiting for API documentation from backend team
- Need access to staging environment
```

## Agent Intelligence

The agent analyzes your standup updates and asks questions about:

1. **Incomplete Tickets**: Tickets mentioned in previous "today" plans but not in current "yesterday" accomplishments
2. **Long-running PRs**: Pull requests mentioned for 3+ days without being merged
3. **Recurring Blockers**: Similar blockers appearing across multiple standups
4. **Inconsistencies**: Mismatches between planned and completed work
5. **Missing Context**: Unclear or incomplete updates

## Data Storage

- **Excel Format**: Default storage in `./data/standup-data.xlsx`
- **JSON Format**: Alternative storage in `./data/standup-data.json`
- **Backups**: Automatic backups created in `./data/backup/` before each update

### Excel Sheets:
- `StandupEntries`: All standup entries with parsed data
- `TeamMembers`: Team member information
- `AgentQuestions`: Questions and answers from the agent

## Configuration

Edit `src/config/config.ts` to customize:

```typescript
export const defaultConfig: AppConfig = {
  bedrock: {
    region: 'us-east-1',
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  },
  dataStorage: {
    type: 'excel', // or 'json'
    filePath: './data/standup-data.xlsx',
    backupPath: './data/backup/',
  },
  agent: {
    maxQuestions: 5,
    questionTimeout: 30000,
    analysisDepth: 7, // days to look back
  },
};
```

## Development

```bash
# Development mode
npm run dev

# Build
npm run build

# Run built version
npm start
```

## Example Workflow

1. **Submit standup update**:
   ```bash
   npm run standup submit -m "Alice" -n "Yesterday: Fixed THM-1234. Today: Working on THM-1235."
   ```

2. **Agent analyzes and asks questions**:
   - "You mentioned working on THM-1235 today, but what happened to THM-1233 that you planned yesterday?"

3. **Answer questions interactively**:
   ```bash
   npm run chat
   ```

4. **View team progress**:
   ```bash
   npm run standup progress
   ```

## Troubleshooting

### AWS Bedrock Access
- Ensure your AWS account has access to Amazon Bedrock
- Check that the Claude model is available in your region
- Verify your AWS credentials have the necessary permissions

### Common Issues
- **"Model not found"**: Check if Claude 3 Sonnet is available in your AWS region
- **"Access denied"**: Verify AWS credentials and Bedrock permissions
- **"File not found"**: The tool will create data directories automatically

## VS Code Integration

While the tool doesn't directly integrate with VS Code Copilot chat, you can:

1. Use the terminal-based chat interface within VS Code's integrated terminal
2. Copy questions from the tool and paste them into Copilot chat for additional context
3. Use the tool's output to inform your conversations with Copilot

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
