const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TOKEN = process.argv[2];
const OWNER = 'hurt158';
const REPO = 'buzhengjing-xiuxian';
const BRANCH = 'main';
const BASE_DIR = 'F:/Reasonix-work/不正经修仙模拟器-APK版';

// Files to upload (relative paths)
const files = [
  'index.html', 'style.css', 'manifest.json', 'sw.js',
  'icon-512.png',
  'server.js', 'start-server.bat', 'start-server.ps1',
  'js/02-data.js', 'js/03-state.js', 'js/04-combat.js',
  'js/05-actions.js', 'js/06-events.js', 'js/07-ui.js',
];
// Add audio files
fs.readdirSync(path.join(BASE_DIR, 'audio')).forEach(f => files.push('audio/' + f));
// Add image files
fs.readdirSync(path.join(BASE_DIR, 'images')).forEach(f => files.push('images/' + f));

async function uploadFiles() {
  for (const filePath of files) {
    const fullPath = path.join(BASE_DIR, filePath);
    const content = fs.readFileSync(fullPath);
    const base64 = content.toString('base64');
    
    // GitHub API: check if file exists
    const apiPath = `/repos/${OWNER}/${REPO}/contents/${filePath.replace(/\\/g, '/')}`;
    
    try {
      // Try to get existing file SHA
      const existing = await githubRequest('GET', apiPath + '?ref=' + BRANCH);
      let sha = null;
      if (existing) {
        sha = existing.sha;
        console.log(`  Updating: ${filePath}`);
      } else {
        console.log(`  Creating: ${filePath}`);
      }
      
      // Create/update file
      await githubRequest('PUT', apiPath, {
        message: `Add ${filePath}`,
        content: base64,
        branch: BRANCH,
        sha: sha
      });
    } catch (e) {
      console.error(`  FAIL: ${filePath} - ${e.message}`);
    }
  }
  console.log('Done!');
}

function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'User-Agent': 'upload-script',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    if (body) {
      options.headers['Content-Type'] = 'application/json';
    }
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch(e) { resolve(null); }
        } else if (res.statusCode === 404) {
          resolve(null); // File doesn't exist
        } else if (res.statusCode === 422 && JSON.parse(data)?.errors?.[0]?.code === 'already_exists') {
          resolve(null); // Conflict, skip
        } else {
          reject(new Error(`${res.statusCode}: ${data.substring(0,200)}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

uploadFiles().catch(console.error);
