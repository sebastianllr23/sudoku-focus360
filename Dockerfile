FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install

# Install typescript and ts-node globally for running the app
RUN npm install -g typescript ts-node

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Expose the API port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
