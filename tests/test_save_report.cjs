const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
const exePath = path.join(repoRoot, 'dr_backend.exe');

const leftImg = path.join(repoRoot, 'explainability', 'gradcam_samples', 'grade0_aptos_1b862fb6f65d.png');
const rightImg = path.join(repoRoot, 'explainability', 'gradcam_samples', 'grade3_aptos_1b495ac025b7.png');

console.log('--- Test Save and PDF Generation on dr_backend.exe ---');

const proc = spawn(exePath, [], {
  cwd: repoRoot,
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = '';
let saveDone = false;

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
      proc.stdin.write(JSON.stringify({
        id: 'test-analyze',
        action: 'analyze',
        leftImgPath: leftImg,
        rightImgPath: rightImg,
      }) + '\n');
    } else if (msg.event === 'analysis_complete') {
      console.log('✓ Analysis complete. Now testing save action...');
      proc.stdin.write(JSON.stringify({
        id: 'test-save',
        action: 'save',
        patientInfo: {
          name: 'Rajesh',
          patientID: 'P-51725',
          age: 51,
          sex: 'Male',
          diabetesDuration: 15,
        }
      }) + '\n');
    } else if (msg.event === 'saved') {
      console.log('✓ SAVED EVENT RECEIVED!');
      console.log('visitPath:', msg.visitPath);
      console.log('pdfPath:', msg.pdfPath, 'Exists:', fs.existsSync(msg.pdfPath));
      console.log('pngPath:', msg.pngPath, 'Exists:', fs.existsSync(msg.pngPath));

      if (fs.existsSync(msg.pdfPath)) {
        saveDone = true;
      }
      proc.stdin.write(JSON.stringify({ id: 'exit-save-test', action: 'exit' }) + '\n');
    } else if (msg.event === 'error') {
      console.error('❌ DAEMON RETURNED ERROR:', msg);
      process.exit(1);
    }
  }
});

proc.on('exit', (code) => {
  console.log(`--- Daemon exited with code ${code}. Save success: ${saveDone} ---`);
  process.exit(saveDone ? 0 : 1);
});
