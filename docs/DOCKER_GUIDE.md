# Docker Deployment Guide

## Quick Start

### 1. Build and Run with Docker Compose (Recommended)

```powershell
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### 2. Build and Run with Docker

```powershell
# Build the image
docker build -t discord-voice-tracker .

# Run the container
docker run -d `
  --name discord-bot `
  -p 3001:3001 `
  -v ${PWD}/config.json:/app/config.json:ro `
  -v ${PWD}/settings.json:/app/settings.json `
  --restart unless-stopped `
  discord-voice-tracker

# View logs
docker logs -f discord-bot

# Stop the container
docker stop discord-bot
docker rm discord-bot
```

## Configuration

### Before Building

1. **Edit `config.json`** with your bot token:
```json
{
  "token": "YOUR_BOT_TOKEN_HERE",
  "testMode": false
}
```

2. **Create `settings.json`** (optional, will be created automatically):
```json
{
  "afkInterval": 30,
  "confirmTimeout": 2
}
```

## Access the Dashboard

Once running, access the dashboard at:
```
http://localhost:3001
```

From another computer on your network:
```
http://YOUR_SERVER_IP:3001
```

## Docker Commands

### View Status
```powershell
docker ps
```

### View Logs
```powershell
docker logs discord-bot
docker logs -f discord-bot  # Follow logs
docker logs --tail 100 discord-bot  # Last 100 lines
```

### Restart Bot
```powershell
docker restart discord-bot
```

### Update Bot
```powershell
# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Shell Access
```powershell
docker exec -it discord-bot sh
```

## Resource Management

### Check Resource Usage
```powershell
docker stats discord-bot
```

### Adjust Memory Limit
Edit `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 2G  # Increase for more users
```

## Environment Variables

Available environment variables in `docker-compose.yml`:

- `NODE_ENV`: Set to `production`
- `TZ`: Your timezone (e.g., `America/New_York`)
- `NODE_OPTIONS`: Node.js memory settings

## Production Deployment

### For Cloud Servers (AWS, Azure, GCP, DigitalOcean)

1. **Install Docker**:
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Upload Files**:
```powershell
# Using SCP
scp -r . user@server:/path/to/bot/

# Or use Git
git clone your-repo
cd your-repo
```

3. **Deploy**:
```bash
cd /path/to/bot
docker-compose up -d
```

### Auto-Start on Server Reboot

Docker Compose with `restart: unless-stopped` will auto-start the bot when the server reboots.

## Monitoring

### Health Check
```powershell
docker inspect --format='{{json .State.Health}}' discord-bot
```

### Container Stats
```powershell
docker stats --no-stream discord-bot
```

## Backup

### Backup Settings
```powershell
docker cp discord-bot:/app/settings.json ./settings-backup.json
```

### Restore Settings
```powershell
docker cp ./settings-backup.json discord-bot:/app/settings.json
docker restart discord-bot
```

## Troubleshooting

### Bot Not Starting
```powershell
# Check logs
docker logs discord-bot

# Common issues:
# 1. Invalid bot token in config.json
# 2. Port 3001 already in use
# 3. Insufficient memory
```

### Dashboard Not Accessible
```powershell
# Check if port is mapped
docker port discord-bot

# Check firewall
# Windows: Allow port 3001 in Windows Firewall
# Linux: sudo ufw allow 3001
```

### High Memory Usage
```powershell
# Check current usage
docker stats discord-bot

# Restart to clear memory
docker restart discord-bot
```

### Update to Latest Code
```powershell
# Stop container
docker-compose down

# Pull latest changes (if using Git)
git pull

# Rebuild and start
docker-compose up -d --build
```

## Advanced Configuration

### Custom Port
Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:3001"  # External:Internal
```

### Multiple Bots
Create separate folders with different `docker-compose.yml` files:
```yaml
services:
  discord-bot-1:
    container_name: discord-bot-1
    ports:
      - "3001:3001"
  
  discord-bot-2:
    container_name: discord-bot-2
    ports:
      - "3002:3001"
```

### Persistent Logs
Create logs directory:
```powershell
mkdir logs
```

Already configured in `docker-compose.yml` volumes section.

## Performance Tips

1. **Limit Logs**: Already configured to keep last 30MB
2. **Resource Limits**: Set in `docker-compose.yml`
3. **Regular Restarts**: Schedule weekly restart
4. **Monitor Memory**: Use `docker stats`

## Security

1. **Protect config.json**: Never commit with real token
2. **Use .env file** (optional):
   ```env
   DISCORD_TOKEN=your_token_here
   ```
   Update `config.json` to read from env:
   ```json
   {
     "token": "${DISCORD_TOKEN}"
   }
   ```

3. **Firewall**: Only expose port 3001 if needed
4. **Updates**: Regularly rebuild with latest Node.js image

## Cleanup

### Remove Container
```powershell
docker-compose down
```

### Remove Image
```powershell
docker rmi discord-voice-tracker
```

### Clean All
```powershell
docker system prune -a
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start | `docker-compose up -d` |
| Stop | `docker-compose down` |
| Logs | `docker-compose logs -f` |
| Restart | `docker-compose restart` |
| Rebuild | `docker-compose up -d --build` |
| Stats | `docker stats discord-bot` |
| Shell | `docker exec -it discord-bot sh` |

Your bot is now containerized and ready for deployment! 🐳
