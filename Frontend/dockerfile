# ---- Stage 1: Build React App ----
    FROM node:22 AS builder
    WORKDIR /app
    
    # Copy package.json & install dependencies
    COPY package*.json ./
    RUN npm install --legacy-peer-deps
    
    # Copy source files & build
    COPY . .
    RUN npm run build
    
    # ---- Stage 2: Serve with Nginx ----
    FROM nginx:alpine
    WORKDIR /usr/share/nginx/html
    
    # Remove default Nginx config & copy built frontend
    RUN rm -rf ./*
    COPY --from=builder /app/build . 
    # Expose port 80
    EXPOSE 80
    
    # Start Nginx
    CMD ["nginx", "-g", "daemon off;"]
    