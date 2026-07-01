export function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
  if (!global._logs) {
    global._logs = [];
  }
  global._logs.push({ timestamp, message, type });
  if (global._logs.length > 50) {
    global._logs.shift();
  }
  console.log(`[${type.toUpperCase()}] ${message}`);
}

export function getLogs() {
  if (!global._logs) {
    global._logs = [];
  }
  return global._logs;
}

export function clearLogs() {
  global._logs = [];
}
