const { spawn } = require('child_process');
const path = require('path');

const backendDir = __dirname;
process.chdir(backendDir);

console.log('Starting backend from:', backendDir);

const proc = spawn('node', ['-r', 'ts-node/register', 'src/server.ts'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true
});

proc.on('exit', (code) => {
  process.exit(code);
});
