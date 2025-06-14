# Use the latest Node.js image as a parent image
FROM node:latest

# Set the working directory in the container
WORKDIR /frontend

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the Vite development server
CMD ["npm", "run", "dev"]
