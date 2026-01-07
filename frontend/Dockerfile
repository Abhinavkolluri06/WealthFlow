FROM node:22-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy the rest of the project
COPY . .

EXPOSE 5173

# The --host flag is essential for Vite to be reachable outside the container
CMD ["npm", "run", "dev", "--", "--host"]