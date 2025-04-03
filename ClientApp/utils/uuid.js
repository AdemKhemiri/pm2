const { execSync } = require('child_process');

function getMachineUUID() {
  try {
    // For Windows
    if (process.platform === 'win32') {
      const result = execSync('wmic csproduct get uuid').toString();
      return result.split('\n')[1].trim();
    }
    // For MacOS
    else if (process.platform === 'darwin') {
      const result = execSync('ioreg -rd1 -c IOPlatformExpertDevice').toString();
      const match = result.match(/"IOPlatformUUID" = "([^"]+)"/);
      return match ? match[1] : null;
    }
    // For Linux
    else {
      const result = execSync('cat /etc/machine-id').toString();
      return result.trim();
    }
  } catch (error) {
    console.error('Error getting machine ID:', error);
    return null;
  }
}


// Export the function
module.exports = getMachineUUID
