FROM nginx:alpine

# Copia apenas os assets estáticos do frontend.
COPY index.html /usr/share/nginx/html/index.html
COPY frontend/ /usr/share/nginx/html/frontend/
COPY assets/ /usr/share/nginx/html/assets/
