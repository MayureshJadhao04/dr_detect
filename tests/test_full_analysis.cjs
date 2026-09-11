const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
const exePath = path.join(repoRoot, 'dr_backend.exe');

const leftImg = path.join(repoRoot, 'explainability', 'gradcam_samples', 'grade0_aptos_1b862fb6f65d.png');
const rightImg = path.join(repoRoot, 'explainability', 'gradcam_samples', 'grade3_aptos_1b495ac025b7.png');

console.log('--- Real End-to-End Analysis Test on dr_backend.exe ---');
console.log('Target exe:', exePath);
console.log('Left Eye Image:', leftImg);
console.log('Right Eye Image:', rightImg);

const proc = spawn(exePath, [], {
  cwd: repoRoot,
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = '';
let analysisDone = false;

proc.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      console.log('[DAEMON LOG]:', line);
      continue;
    }

    console.log('[DAEMON EVENT]:', msg.event, msg.id || '', msg.stage || '');

    if (msg.event === 'ready') {
      console.log('✓ Daemon is READY. Dispatching analyze request...');
      const req = {
        id: 'real-analysis-101',
        action: 'analyze',
        leftImgPath: leftImg,
        rightImgPath: rightImg,
      };
      proc.stdin.write(JSON.stringify(req) + '\n');
    } else if (msg.event === 'progress') {
      console.log(`  -> Progress ${msg.percent}%: ${msg.stage}`);
    } else if (msg.event === 'analysis_complete') {
      console.log('✓ ANALYSIS_COMPLETE RECEIVED!');
      console.log('Summary:', JSON.stringify(msg.summary, null, 2));

      // Verify heatmaps on disk
      if (msg.summary && msg.summary.leftEye && msg.summary.leftEye.heatmapPath) {
        console.log('Left heatmap exists:', fs.existsSync(msg.summary.leftEye.heatmapPath));
      }
      if (msg.summary && msg.summary.rightEye && msg.summary.rightEye.heatmapPath) {
        console.log('Right heatmap exists:', fs.existsSync(msg.summary.rightEye.heatmapPath));
      }

      analysisDone = true;
      console.log('Closing daemon...');
      proc.stdin.write(JSON.stringify({ id: 'exit-now', action: 'exit' }) + '\n');
    } else if (msg.event === 'error') {
      console.error('❌ DAEMON RETURNED ERROR:', msg);
      process.exit(1);
    }
  }
});

proc.on('exit', (code) => {
  console.log(`--- Daemon exited with code ${code}. Analysis success: ${analysisDone} ---`);
  process.exit(analysisDone ? 0 : 1);
});
