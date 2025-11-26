# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create settings file if it doesn't exist
RUN touch settings.json

# Expose dashboard port
EXPOSE 3001

# Set memory limit for better performance with 100+ users
ENV NODE_OPTIONS="--max-old-space-size=512"

# Health check for the dashboard
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/status', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the bot
CMD ["node", "server.js"]
