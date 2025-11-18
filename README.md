# Ping Command Trigger

A web application that allows you to trigger a `ping google.com -t` command on your local Windows CMD from a web browser. The web page can be deployed to Vercel and will connect to a local Node.js server running on your machine.

## 🚀 Features

- Beautiful, responsive web interface
- Click a button to execute `ping google.com -t` in your local CMD
- Works when deployed to Vercel - connects to localhost on each user's machine
- Real-time server connection status
- Visual feedback for all actions

## 📋 Prerequisites

- Node.js (v14 or higher) installed on your local machine
- npm or yarn package manager
- Windows operating system (for CMD commands)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Local Server

```bash
npm start
```

The server will start on `http://localhost:3001`. Keep this terminal window open - the server needs to keep running.

### 3. Open the Web Page

- **Local development**: Open `http://localhost:3001` in your browser
- **Deployed version**: Open your Vercel deployment URL

### 4. Click the Button

Click the "Run Ping Command" button to execute `ping google.com -t` in a new CMD window.

## 🌐 Deploying to Vercel

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

   Or connect your GitHub repository to Vercel for automatic deployments.

3. **Important**: Each user who wants to use the deployed page must:
   - Have Node.js installed
   - Run `npm install` and `npm start` locally
   - Keep the local server running on port 3001

## 📁 Project Structure

```
├── server.js          # Local Node.js server that executes commands
├── package.json       # Project dependencies
├── vercel.json        # Vercel deployment configuration
├── public/
│   └── index.html     # Web page with button interface
└── README.md          # This file
```

## 🔧 How It Works

1. **Web Page**: The HTML page (deployed on Vercel) contains a button
2. **Local Server**: A Node.js server runs on your local machine (localhost:3001)
3. **Communication**: When you click the button, the web page makes an HTTP POST request to `http://localhost:3001/api/ping`
4. **Command Execution**: The local server executes `ping google.com -t` using Node.js `spawn` and opens it in CMD

## ⚠️ Important Notes

- The local server must be running for the web page to work
- The server checks for connection every 5 seconds
- Each user needs to run their own local server instance
- The ping command runs in a detached process, so it won't block the server
- Works on Windows (uses `cmd /c`)

## 🐛 Troubleshooting

- **"Cannot connect to local server"**: Make sure `npm start` is running
- **Port 3001 already in use**: Change the PORT in `server.js` and update API_URL in `index.html`
- **Command not executing**: Check that you're on Windows and CMD is available

## 📝 License

MIT

