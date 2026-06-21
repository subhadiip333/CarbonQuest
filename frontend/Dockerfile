FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

ENV NEXT_PUBLIC_API_URL=https://carbonquest-backend-694641349102.asia-south1.run.app/api/v1

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
