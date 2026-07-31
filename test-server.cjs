const { spawn } = require('child_process');
const http = require('http');

console.log('Starting wrangler dev...');
const child = spawn('npx.cmd', ['wrangler', 'dev', '--port', '8788'], { stdio: 'pipe', shell: true });

child.stdout.on('data', data => console.log(`wrangler: ${data}`));
child.stderr.on('data', data => console.error(`wrangler: ${data}`));

setTimeout(() => {
  console.log('Testing /assets/index-SEHhxqC-.js');
  http.get('http://127.0.0.1:8788/assets/index-SEHhxqC-.js', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('JS Status:', res.statusCode);
      console.log('JS length:', data.length);
      console.log('JS Starts with HTML?', data.trim().startsWith('<'));
      console.log('JS Header:', data.substring(0, 50));
      
      console.log('Testing client-side routing (/dashboard)');
      http.get('http://127.0.0.1:8788/dashboard', (res2) => {
         let data2 = '';
         res2.on('data', chunk => data2 += chunk);
         res2.on('end', () => {
            console.log('Dashboard Status:', res2.statusCode);
            console.log('Dashboard length:', data2.length);
            console.log('Dashboard Starts with HTML?', data2.trim().startsWith('<'));
            console.log('Dashboard Header:', data2.substring(0, 50));
            child.kill();
            process.exit(0);
         });
      }).on('error', err => {
         console.error('Error fetching dashboard:', err);
         child.kill();
         process.exit(1);
      });
    });
  }).on('error', (err) => {
    console.error('Error fetching JS:', err);
    child.kill();
    process.exit(1);
  });
}, 7000); // give wrangler 7s to start
