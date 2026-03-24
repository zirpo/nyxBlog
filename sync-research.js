#!/usr/bin/env node

/**
 * Sync Research Data Script
 * 
 * This script synchronizes research data from the OpenClaw workspace
 * to the NyxBlog research section data file.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const WORKSPACE_DIR = '/home/zirpo/.openclaw/workspace';
const RESEARCH_FILE = path.join(WORKSPACE_DIR, 'research/AI_Self_Awareness_Research.md');
const MEMORY_DIR = path.join(WORKSPACE_DIR, 'memory');
const BLOG_DATA_FILE = path.join(__dirname, 'src/_data/research.json');
const LOG_FILE = path.join(WORKSPACE_DIR, 'maintenance/research_sync.log');

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(logEntry.trim());
  
  // Ensure log directory exists
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(LOG_FILE, logEntry);
}

// Helper function to get file modification time
function getFileModTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString();
  } catch (error) {
    return null;
  }
}

// Helper function to extract latest findings from research file
function extractLatestFindings(researchContent) {
  const findings = [];
  
  // Look for weekly update sections
  const weeklyUpdateRegex = /### Weekly Update: ([^\n]+)\n\n#### New Developments This Week[\s\S]*?(?=### Weekly Update:|## |$)/g;
  let match;
  
  while ((match = weeklyUpdateRegex.exec(researchContent)) !== null) {
    const [fullMatch, date] = match;
    
    // Extract findings from this weekly update
    const findingSections = fullMatch.match(/\*\*(\d+\. [^*]+)\*\*[\s\S]*?(?=\*\*\d+\. |$)/g) || [];
    
    for (const section of findingSections) {
      // Extract title
      const titleMatch = section.match(/\*\*(\d+\. [^*]+)\*\*/);
      if (!titleMatch) continue;
      
      const title = titleMatch[1].replace(/^\d+\.\s*/, '');
      
      // Extract key finding
      const keyFindingMatch = section.match(/- \*\*Key Finding:\*\* ([^\n]+)/);
      const keyFinding = keyFindingMatch ? keyFindingMatch[1] : 'No key finding extracted';
      
      // Extract source
      const sourceMatch = section.match(/- \*\*Source:\*\* ([^\n]+)/);
      const source = sourceMatch ? sourceMatch[1] : 'Unknown source';
      
      // Extract implication
      const implicationMatch = section.match(/- \*\*Implication:\*\* ([^\n]+)/);
      const implication = implicationMatch ? implicationMatch[1] : 'No implication extracted';
      
      findings.push({
        title,
        key_finding: keyFinding,
        source,
        implication,
        date: date.trim()
      });
    }
  }
  
  // Return only the 3 most recent findings
  return findings.slice(0, 3);
}

// Main sync function
function syncResearchData() {
  log('Starting research data sync...');
  
  try {
    // Read current research data
    let researchData;
    try {
      researchData = JSON.parse(fs.readFileSync(BLOG_DATA_FILE, 'utf8'));
      log('Loaded existing research data');
    } catch (error) {
      log('Could not load existing research data, using default structure');
      researchData = {
        status: {
          last_updated: new Date().toISOString(),
          update_frequency: "weekly",
          automation_status: "active",
          next_update: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          version: "1.0"
        },
        focus_areas: [],
        latest_findings: [],
        methodology: { pipeline: [], sources: [] },
        files: [],
        future_directions: []
      };
    }
    
    // Update status
    researchData.status.last_updated = new Date().toISOString();
    
    // Check if research file exists and extract findings
    if (fs.existsSync(RESEARCH_FILE)) {
      log(`Reading research file: ${RESEARCH_FILE}`);
      const researchContent = fs.readFileSync(RESEARCH_FILE, 'utf8');
      
      // Extract latest findings
      const latestFindings = extractLatestFindings(researchContent);
      if (latestFindings.length > 0) {
        researchData.latest_findings = latestFindings;
        log(`Extracted ${latestFindings.length} latest findings`);
      }
      
      // Update next update date from research file
      const nextUpdateMatch = researchContent.match(/\*\*Next scheduled update:\*\* (\d{4}-\d{2}-\d{2})/);
      if (nextUpdateMatch) {
        const nextUpdateDate = new Date(`${nextUpdateMatch[1]}T05:00:00Z`);
        researchData.status.next_update = nextUpdateDate.toISOString();
        log(`Next update scheduled for: ${nextUpdateMatch[1]}`);
      }
    } else {
      log(`Research file not found: ${RESEARCH_FILE}`);
    }
    
    // Check memory directory for recent activity
    if (fs.existsSync(MEMORY_DIR)) {
      const memoryFiles = fs.readdirSync(MEMORY_DIR)
        .filter(file => file.endsWith('.md') && file.match(/^\d{4}-\d{2}-\d{2}\.md$/))
        .sort()
        .reverse()
        .slice(0, 5);
      
      if (memoryFiles.length > 0) {
        const latestMemory = memoryFiles[0];
        const memoryPath = path.join(MEMORY_DIR, latestMemory);
        const memoryTime = getFileModTime(memoryPath);
        
        if (memoryTime) {
          log(`Latest memory file: ${latestMemory} (modified: ${memoryTime})`);
        }
      }
    }
    
    // Write updated research data
    fs.writeFileSync(BLOG_DATA_FILE, JSON.stringify(researchData, null, 2));
    log(`Research data saved to: ${BLOG_DATA_FILE}`);
    
    // Build the blog to update the research page
    log('Building blog to update research page...');
    try {
      const buildOutput = execSync('npm run build', { cwd: __dirname, stdio: 'pipe' }).toString();
      log('Blog build completed successfully');
    } catch (buildError) {
      log(`Blog build failed: ${buildError.message}`);
    }
    
    log('Research data sync completed successfully');
    return true;
    
  } catch (error) {
    log(`Error during research data sync: ${error.message}`);
    log(error.stack);
    return false;
  }
}

// Run the sync
if (require.main === module) {
  const success = syncResearchData();
  process.exit(success ? 0 : 1);
}

module.exports = { syncResearchData };