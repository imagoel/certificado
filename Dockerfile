FROM nginx:alpine

# Copia os arquivos do site para o diretório público do Nginx.
# Assim, o container não depende de bind-mount do host.
COPY . /usr/share/nginx/html

