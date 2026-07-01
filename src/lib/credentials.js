import fs from 'fs';
import path from 'path';

export function getLiveCredentials() {
  const credentialsPath = path.join(
    process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Admin',
    '.brevo',
    'credentials.json'
  );
  if (fs.existsSync(credentialsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      // Determine the active app ID from appNames (most recently saved)
      let activeAppId = null;
      if (data.appNames) {
        const appIds = Object.keys(data.appNames);
        if (appIds.length > 0) {
          appIds.sort((a, b) => {
            const timeA = data.appNames[a].savedAt || 0;
            const timeB = data.appNames[b].savedAt || 0;
            return timeB - timeA;
          });
          activeAppId = appIds[0];
        }
      }

      if (data.apps) {
        if (activeAppId && data.apps[activeAppId]) {
          const activeApp = data.apps[activeAppId];
          if (activeApp.clientId && activeApp.clientSecret) {
            return {
              clientId: activeApp.clientId,
              clientSecret: activeApp.clientSecret
            };
          }
        }

        const appIds = Object.keys(data.apps);
        if (appIds.length > 0) {
          const firstApp = data.apps[appIds[0]];
          if (firstApp.clientId && firstApp.clientSecret) {
            return {
              clientId: firstApp.clientId,
              clientSecret: firstApp.clientSecret
            };
          }
        }
      }
      
      if (data.client_id && data.client_secret) {
        return {
          clientId: data.client_id,
          clientSecret: data.client_secret
        };
      }
      if (data.clientId && data.clientSecret) {
        return {
          clientId: data.clientId,
          clientSecret: data.clientSecret
        };
      }
    } catch (e) {
      console.error('Failed to read live credentials:', e.message);
    }
  }
  return {
    clientId: '',
    clientSecret: ''
  };
}
