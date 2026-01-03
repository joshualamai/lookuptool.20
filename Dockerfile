FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create database directory
RUN mkdir -p database

# Expose port
EXPOSE 3000

# Initialize database and start server
CMD ["sh", "-c", "npm run init-db && npm run seed && npm start"]

