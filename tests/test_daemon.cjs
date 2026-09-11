const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'models', 'pipelineServer.m').replace(/\\/g, '/');

const fs = require('fs');
const exePath = path.join(repoRoot, 'dr_backend.exe');
const useExe = fs.existsSync(exePath);

console.log('--- Starting MATLAB Daemon Protocol Test ---');
console.log('Target:', useExe ? exePath : scriptPath);

// Launch daemon: compiled exe vs matlab fallback
const proc = useExe 
  ? spawn(exePath, [], { cwd: repoRoot, stdio: ['pipe', 'pipe', 'pipe'] })
  : spawn('matlab', ['-batch', `run('${scriptPath}');`], { cwd: repoRoot, stdio: ['pipe', 'pipe', 'pipe'] });

let isReady = false;
let testStep = 0;
let buffer = '';

proc.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    console.log('[DAEMON STDOUT]:', line);

    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      console.log('[NON-JSON]:', line);
      continue;
    }

    if (msg.event === 'ready') {
      console.log('✓ Handshake received: READY. Testing ping...');
      isReady = true;
      proc.stdin.write(JSON.stringify({ id: 'test-ping', action: 'ping' }) + '\n');
    } else if (msg.event === 'pong') {
      console.log('✓ Ping response received: PONG. Testing error handling on missing file...');
      proc.stdin.write(JSON.stringify({
        id: 'test-err-missing',
        action: 'analyze',
        leftImgPath: 'D:\\non_existent_left.jpg',
        rightImgPath: 'D:\\non_existent_right.jpg',
      }) + '\n');
    } else if (msg.id === 'test-err-missing' && msg.event === 'error') {
      console.log(`✓ Missing file caught correctly: code=${msg.code}, message="${msg.message}"`);
      console.log('Testing malformed JSON handling...');
      proc.stdin.write('{invalid json string\n');
    } else if (msg.event === 'error' && msg.code === 'MALFORMED_JSON') {
      console.log(`✓ Malformed JSON caught correctly: code=${msg.code}`);
      console.log('Testing graceful shutdown...');
      proc.stdin.write(JSON.stringify({ id: 'test-exit', action: 'exit' }) + '\n');
    } else if (msg.event === 'exiting') {
      console.log('✓ Daemon acknowledged exit.');
    }
  }
});

proc.stderr.on('data', (data) => {
  console.error('[DAEMON STDERR]:', data.toString());
});

proc.on('exit', (code) => {
  console.log(`\n--- Daemon exited with code ${code}. Test complete! ---`);
  process.exit(code === 0 ? 0 : 1);
});

// Watchdog timer (timeout after 90s)
setTimeout(() => {
  console.error('Test timed out after 90s');
  proc.kill();
  process.exit(1);
}, 90000);
