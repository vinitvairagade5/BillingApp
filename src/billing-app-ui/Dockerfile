# Stage 1: Build the Angular application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output to Nginx's html directory
# Note: Check if your angular.json outputPath matches 'dist/billing-app-ui/browser' 
# For Angular 17+ it is usually dist/<project-name>/browser
COPY --from=build /app/dist/billing-app-ui/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
