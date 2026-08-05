const { execSync } = require('child_process');

function killPort3000() {
  const targetPort = 3000;
  console.log(`[predev] Checking if port ${targetPort} is occupied...`);

  try {
    if (process.platform === 'win32') {
      // Windows: use netstat to find PIDs listening on port 3000
      const netstatOutput = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
      const lines = netstatOutput.split('\n');
      const pidsToKill = new Set();

      for (const line of lines) {
        if (line.includes(`:${targetPort}`) && line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && Number(pid) !== process.pid) {
            pidsToKill.add(pid);
          }
        }
      }

      if (pidsToKill.size === 0) {
        console.log(`[predev] Port ${targetPort} is clear. Proceeding...`);
        return;
      }

      for (const pid of pidsToKill) {
        console.log(`[predev] Found process PID ${pid} listening on port ${targetPort}. Killing...`);
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[predev] Successfully killed process PID ${pid}.`);
        } catch {
          // Process may have already exited
        }
      }
    } else {
      // macOS/Linux fallback: use lsof
      try {
        const pids = execSync(`lsof -t -i:${targetPort}`, { encoding: 'utf8' }).trim().split('\n');
        for (const pid of pids) {
          if (pid && Number(pid) !== process.pid) {
            console.log(`[predev] Found process PID ${pid} listening on port ${targetPort}. Killing...`);
            execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
            console.log(`[predev] Successfully killed process PID ${pid}.`);
          }
        }
      } catch {
        console.log(`[predev] Port ${targetPort} is clear. Proceeding...`);
      }
    }
  } catch (err) {
    console.warn(`[predev] Port check completed with warning:`, err.message);
  }
}

killPort3000();
