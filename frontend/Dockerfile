# ---- BUILD STAGE ----
# Stage 1: Use Node to build the React app into static files
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install exact versions from lockfile
RUN npm ci

# Copy the rest of the frontend code
COPY . .

# Build the React app into static HTML, CSS and JS files
RUN npm run build

# ---- SERVE STAGE ----
# Stage 2: nginx serves the built files and proxies API calls to the backend
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config — handles routing and reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]