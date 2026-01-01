FROM node:20-alpine

WORKDIR /app

# Copy package files (ignore lock file - will regenerate)
COPY package.json ./

# Install dependencies fresh
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
