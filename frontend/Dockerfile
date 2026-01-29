FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY . .

RUN pnpm install

# Accept build argument for API URL
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm run deploy

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set entrypoint and command
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server/entry.node-server.js"]
