# Serve the application with Nginx
FROM nginx:alpine

# Copy the build output to Nginx's html directory
# GitHub Actions will build this into src/billing-app-ui/dist/billing-app-ui/browser
COPY dist/billing-app-ui/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
