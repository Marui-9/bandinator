# Troubleshooting: Cannot Connect to Backend

## Problem

Getting "unable to connect" when trying to access http://localhost:3001

## Root Cause

The backend server is **not running**. VS Code's Flatpak terminal environment doesn't have access to your system's Node.js installation (installed via nvm).

## Solution

### Option 1: Use External Terminal (RECOMMENDED)

1. **Open a terminal outside VS Code** (Konsole, GNOME Terminal, etc.)

2. **Navigate to project directory:**

   ```bash
   cd /home/jacob/Desktop/bandinator
   ```

3. **Start the development servers:**

   ```bash
   pnpm dev
   ```

   This will start:
   - Backend API at http://localhost:3001
   - Frontend at http://localhost:3000

4. **Keep this terminal open** - The servers need to stay running

5. **In your browser, visit:** http://localhost:3000

### Option 2: Start Servers Separately

If `pnpm dev` doesn't work, start them individually:

**Terminal 1 (Backend):**

```bash
cd /home/jacob/Desktop/bandinator
pnpm --filter app-backend dev
```

**Terminal 2 (Frontend):**

```bash
cd /home/jacob/Desktop/bandinator
pnpm --filter app-frontend dev
```

### Option 3: Use tmux/screen

```bash
# Start backend in background
cd /home/jacob/Desktop/bandinator
tmux new-session -d -s backend 'pnpm --filter app-backend dev'

# Start frontend in background
tmux new-session -d -s frontend 'pnpm --filter app-frontend dev'

# View backend logs
tmux attach -t backend

# Detach with: Ctrl+B then D
```

## Verification

### Check if servers are running:

```bash
# Check backend (should see node process on port 3001)
netstat -tlnp | grep 3001

# Check frontend (should see vite process on port 3000)
netstat -tlnp | grep 3000

# Or use ss command
ss -tlnp | grep -E '3000|3001'
```

### Test backend directly:

```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Check for errors:

Look at the terminal output where you ran `pnpm dev`. You should see:

```
🚀 Backend server running on http://localhost:3001
📁 Uploads directory: ./uploads
💾 Database directory: ./data
```

## Common Issues

### Issue: "Port already in use"

```bash
# Find what's using the port
lsof -i :3001
# Or on Fedora/RHEL
ss -tlnp | grep 3001

# Kill the process
kill -9 <PID>
```

### Issue: "pnpm: command not found"

Your nvm environment isn't loaded. Run:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22
```

### Issue: Database errors

```bash
# Delete and recreate database
rm data/bandinator.db
pnpm dev  # Will recreate on startup
```

### Issue: TypeScript errors

```bash
# Rebuild packages
pnpm build
```

## Why VS Code Terminal Doesn't Work

VS Code is running in a **Flatpak sandbox** which doesn't have access to:

- Your system's Node.js (installed via nvm in `~/.nvm`)
- Your system's pnpm
- Your local environment variables

The VS Code terminal can only access Node.js/npm if they're installed **inside** the Flatpak, which yours aren't.

## Long-term Solution

### Option A: Continue using external terminal (easiest)

Just start servers in a regular terminal and code in VS Code.

### Option B: Install Node in Flatpak

```bash
flatpak install flathub org.freedesktop.Sdk.Extension.node20
```

Then configure VS Code to use it (complex, not recommended).

### Option C: Use non-Flatpak VS Code

Install VS Code directly from Microsoft's RPM/DEB instead of Flatpak.

## Quick Reference

```bash
# In external terminal (not VS Code):
cd /home/jacob/Desktop/bandinator
pnpm dev

# Then in browser:
# http://localhost:3000 (Frontend - main interface)
# http://localhost:3001 (Backend - API)
# http://localhost:3001/health (Health check)
```

## Still Having Issues?

1. Make sure Node.js v22.20.0 is active:

   ```bash
   node --version  # Should show v22.20.0
   ```

2. Check if pnpm is installed:

   ```bash
   pnpm --version
   ```

3. Verify you're in the right directory:

   ```bash
   pwd  # Should show: /home/jacob/Desktop/bandinator
   ls package.json  # Should exist
   ```

4. Check terminal output for specific error messages

## Success Checklist

- [ ] Opened external terminal (outside VS Code)
- [ ] Navigated to `/home/jacob/Desktop/bandinator`
- [ ] Confirmed Node.js v22.20.0 is active
- [ ] Ran `pnpm dev`
- [ ] See "Backend server running" message
- [ ] See "Local: http://localhost:3000" message
- [ ] Can access http://localhost:3000 in browser
- [ ] Can see dashboard with Quick Actions

Once servers are running, keep that terminal open and continue coding in VS Code!
