FROM nginx:alpine

# Copia apenas os assets estáticos do frontend.
COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY frontend/ /usr/share/nginx/html/frontend/
COPY assets/ /usr/share/nginx/html/assets/

