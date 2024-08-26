# Base image
FROM node:18.17.0-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start:prod"]