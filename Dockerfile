# Use official lightweight Node image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (better Docker caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the app
COPY . .

# Expose the port our app runs on
EXPOSE 3000

# Start the app
CMD ["node", "app.js"]