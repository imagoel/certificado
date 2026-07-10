FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia apenas os assets estaticos do frontend.
COPY index.html /usr/share/nginx/html/index.html
COPY frontend/ /usr/share/nginx/html/frontend/
COPY assets/ /usr/share/nginx/html/assets/

# Publica assets usados fora da API, como a logo do template de e-mail.
COPY api/static/ /usr/share/nginx/html/static/
