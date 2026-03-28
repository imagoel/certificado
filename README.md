# Sistema de Certificados

Projeto dividido em duas partes:
- **Frontend**: exige login, monta o certificado no navegador, faz a pre-visualizacao em `canvas` e exporta o PNG final.
- **API**: autentica usuarios, registra certificados, gera o QR Code em PNG, valida por codigo e armazena o arquivo final enviado pelo frontend.

## Arquitetura Atual

Fluxo atual:
1. o usuario entra com login e senha no frontend
2. o frontend envia os dados do certificado para a API
3. a API gera o codigo oficial e a URL de validacao
4. o frontend solicita a imagem PNG do QR Code a API
5. o frontend desenha o certificado completo no `canvas`
6. o frontend converte o `canvas` para PNG
7. o frontend envia esse PNG final para a API armazenar

Resumo importante:
- o **QR Code** e gerado no backend
- o **PNG final do certificado** e gerado no frontend
- o backend **nao desenha o certificado completo** hoje; ele apenas recebe e salva o PNG pronto
- a tela inicial do gerador agora e **restrita por login**
- a validacao do QR em `/validar/{codigo}` continua **publica**

## Autenticacao e Acesso

Modelo atual:
- sessao por cookie HTTP-only
- usuarios salvos no banco
- papeis iniciais: `admin_global` e `operador`
- estrutura pronta para multiplas secretarias

Regras desta etapa:
- `http://localhost:28754` abre em tela de login
- geracao individual, lote e upload do PNG exigem autenticacao
- `GET /validar/{codigo}` e `GET /api/validar/{codigo}` continuam publicos
- `GET /health` continua publico
- a documentacao em `/docs` pode ficar liberada apenas para admin ou ser desativada por ambiente

## Multi-secretaria

O banco ja esta preparado para:
- vincular usuarios a uma ou mais secretarias
- gravar em cada certificado qual secretaria emitiu
- gravar qual usuario emitiu o certificado

Secretarias iniciais do seed:
- `SESAU`
- `SEMED`
- `SEAFI`
- `SEAMA`
- `SEMOP`
- `SUGEP`

## Frontend

### Funcionalidades
- login na pagina inicial
- geracao individual de certificado em PNG no navegador
- geracao em lote por planilha (`.xlsx`, `.xls`, `.csv`)
- exportacao do lote em `.zip`
- area interna de certificados com filtros, consulta e reimpressao
- filtros por texto, secretaria, periodo de conclusao, periodo de emissao e presenca do PNG salvo
- area administrativa para cadastro de usuarios e secretarias
- painel de auditoria para acompanhar logins, emissoes, uploads e acoes administrativas
- registro automatico de certificados na API antes da geracao do PNG
- uso automatico do QR Code oficial retornado pela API
- upload automatico do PNG final para armazenamento no servidor
- visualizacao do certificado salvo na pagina publica de validacao

### Colunas da planilha
- obrigatoria: `nome` (ou `nome` + `sobrenome` em colunas separadas)
- opcionais: `curso`, `data`, `linha1`, `linha2`, `arquivo`
- modelo minimo recomendado: apenas a coluna `nome`

Regras:
- se a planilha vier so com `nome`, os campos do formulario (`curso`, `data` e textos) sao usados como padrao para todos os alunos
- se a planilha vier com `nome` e `sobrenome`, o sistema concatena automaticamente para formar o nome completo
- o codigo do certificado e sempre gerado pelo backend
- a URL do QR e sempre definida pelo backend (`url_validacao`)
- a imagem do QR Code e gerada pela API (`GET /api/qrcode`)
- o arquivo PNG final e gerado no frontend e enviado automaticamente para o backend apos a geracao

## API

### Responsabilidades
- autenticar usuarios
- registrar certificados e gerar codigos oficiais
- gerar o PNG do QR Code usado pelo frontend
- validar integridade por HMAC-SHA256
- armazenar e servir o PNG final do certificado

### Endpoints principais

Publicos:
- `GET /health`
- `GET /api/qrcode?texto=...`
- `GET /api/validar/{codigo}`
- `GET /validar/{codigo}`
- `GET /api/certificados/{codigo}/arquivo`

Autenticados:
- `GET /api/auth/me`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/select-secretaria`
- `GET /api/certificados`
- `POST /api/certificados`
- `POST /api/certificados/lote`
- `POST /api/certificados/{codigo}/arquivo`
- `GET /docs` (somente admin autenticado)
- `GET /openapi.json` (somente admin autenticado)

Administrativos (`admin_global`):
- `GET /api/admin/secretarias`
- `POST /api/admin/secretarias`
- `PATCH /api/admin/secretarias/{id}`
- `GET /api/admin/usuarios`
- `POST /api/admin/usuarios`
- `PATCH /api/admin/usuarios/{id}`
- `GET /api/admin/auditoria`

## Subindo com Docker Compose

Se estiver configurando um ambiente novo, use `.env.example` como base para gerar seu `.env`.

```bash
docker compose up -d --build
```

Servicos:
- Frontend: `http://localhost:28754`
- API: `http://localhost:29180`
- PostgreSQL: `localhost:25432`

Volumes:
- `postgres_data`: dados do banco
- `certificados_media`: arquivos PNG salvos no servidor (`/app/data/certificados` no container da API)

Em deploy por Portainer + repositorio Git privado:
- mantenha o `docker-compose.yml` no repositorio
- configure as variaveis de ambiente da stack diretamente no Portainer
- use os volumes nomeados do Compose ou bind mounts definidos no servidor
- nao publique o `.env` real no Git
- para a stack de producao, prefira `docker-compose.portainer.yml`

## Provisionamento Inicial

Depois de subir os containers, rode os seeds iniciais dentro do container da API:

```bash
docker exec certificado-api python manage.py seed-secretarias
docker exec certificado-api python manage.py create-admin --nome "Administrador Local" --username admin --password "troque-esta-senha"
```

Opcionalmente, o bootstrap inicial pode ser automatico no startup da API:
- `AUTO_SEED_SECRETARIAS=true`
- `AUTO_BOOTSTRAP_ADMIN=true`
- `BOOTSTRAP_ADMIN_NAME=Administrador`
- `BOOTSTRAP_ADMIN_USERNAME=admin`
- `BOOTSTRAP_ADMIN_PASSWORD=uma-senha-forte`

Com essa opcao ligada:
- as secretarias iniciais sao criadas automaticamente se estiverem ausentes
- o admin inicial so e criado/atualizado se ainda nao existir nenhum `admin_global`

Em seguida:
1. abra `http://localhost:28754`
2. entre com o usuario criado
3. escolha a secretaria ativa, se aparecer o seletor
4. use a aba `Certificados` para consultar e reimprimir os PNGs salvos
5. se estiver com perfil `admin_global`, use a aba `Administracao` para criar usuarios e secretarias
6. na mesma aba `Administracao`, acompanhe a trilha de auditoria do sistema

## Testes Automatizados

Suite inicial coberta:
- autenticacao e autorizacao de `admin_global` e `operador`
- criacao e validacao publica de certificados
- exclusao administrativa de certificados
- compatibilidade entre hashes legados em SHA-256 e hashes novos em HMAC-SHA256
- versionamento do schema com Alembic

Para executar em um ambiente Python com dependencias de desenvolvimento:

```bash
python3 -m pip install -r requirements-dev.txt
PYTHONPATH=api pytest -q
```

## Migracoes

O projeto agora usa Alembic para versionar o schema do banco.

Comando manual:

```bash
cd api
python3 manage.py migrate
```

Compatibilidade:
- bancos vazios sobem pela migration baseline
- bancos legados sem `alembic_version` sao adotados automaticamente no startup
- a ponte legada existe apenas para absorver a base atual sem quebra; proximas mudancas de schema devem entrar por revisoes do Alembic

## Configuracao Local

Variaveis principais em `.env`:
- `APP_ENV=development`
- `CODE_PREFIX=ABC`
- `PUBLIC_VALIDATION_BASE_URL=http://localhost:29180/validar`
- `CERTIFICADOS_MAX_UPLOAD_BYTES=5242880`
- `SESSION_SECRET=troque-esta-chave-local`
- `CERTIFICATE_HASH_SECRET=troque-esta-chave-do-certificado`
- `SESSION_COOKIE_NAME=certificado_session`
- `SESSION_SAME_SITE=lax`
- `SESSION_HTTPS_ONLY=false`
- `SESSION_MAX_AGE_SECONDS=43200`
- `ENABLE_ADMIN_DOCS=true`
- `TRUST_PROXY_HEADERS=false`
- `LOGIN_MAX_ATTEMPTS=5`
- `LOGIN_WINDOW_SECONDS=900`
- `LOGIN_BLOCK_SECONDS=900`
- `CORS_ALLOW_ORIGINS=http://localhost:28754,http://127.0.0.1:28754`
- `AUTO_SEED_SECRETARIAS=false`
- `AUTO_BOOTSTRAP_ADMIN=false`
- `BOOTSTRAP_ADMIN_NAME=Administrador`
- `BOOTSTRAP_ADMIN_USERNAME=admin`
- `BOOTSTRAP_ADMIN_PASSWORD=troque-esta-senha`

Observacoes:
- em ambiente local, o frontend usa `localhost:29180` automaticamente
- em producao, se frontend e API estiverem no mesmo dominio com proxy/tunnel, o frontend usa a mesma origem automaticamente
- em producao, troque `PUBLIC_VALIDATION_BASE_URL` pelo dominio publico oficial
- em producao, troque `SESSION_SECRET` por uma chave longa e exclusiva
- em producao, troque `CERTIFICATE_HASH_SECRET` por uma chave longa e exclusiva e mantenha esse valor estavel
- em producao, use `APP_ENV=production`
- em producao, prefira `SESSION_HTTPS_ONLY=true`
- em producao, defina `TRUST_PROXY_HEADERS=true` somente se houver proxy confiavel na frente da API
- em producao, revise `CORS_ALLOW_ORIGINS` para o dominio oficial do frontend
- em producao, decida entre `ENABLE_ADMIN_DOCS=false` ou docs liberada apenas para administradores
- o backend agora limita tentativas de login por `usuario + IP`; ajuste `LOGIN_MAX_ATTEMPTS`, `LOGIN_WINDOW_SECONDS` e `LOGIN_BLOCK_SECONDS` conforme a operacao
- hashes antigos em SHA-256 continuam validando; novos certificados passam a usar HMAC-SHA256
- o comando `create-admin` pode ser usado novamente para trocar a senha temporaria do administrador

### Checklist de producao

Antes de publicar:
1. troque a senha do admin inicial com `docker exec certificado-api python manage.py create-admin --nome "Administrador" --username admin --password "uma-senha-forte"`
2. configure `APP_ENV=production`
3. configure `SESSION_SECRET` com uma chave longa e exclusiva
4. configure `SESSION_HTTPS_ONLY=true`
5. revise `CORS_ALLOW_ORIGINS` para o dominio real do frontend
6. decida se `ENABLE_ADMIN_DOCS` fica `false`

## Portainer e Tunnel

Fluxo recomendado para a prefeitura:
- Portainer lendo o repositorio Git privado
- stack de producao usando `docker-compose.portainer.yml`
- tunnel/dominio publico encaminhando:
  - `/` para `http://10.75.2.16:28754`
  - `/api/*`, `/health` e `/validar/*` para `http://10.75.2.16:29180`

Com esse modelo:
- o frontend e a API ficam no mesmo dominio publico
- o frontend passa a usar a mesma origem automaticamente em producao
- o QR Code deve apontar para o dominio publico configurado em `PUBLIC_VALIDATION_BASE_URL`

## Estrutura

- `index.html`, `styles.css`, `app.js`: login, interface, pre-visualizacao e geracao local do PNG final
- `api/main.py`: bootstrap da API, middlewares e inclusao dos routers
- `api/common.py`: configuracao compartilhada, dependencias, builders e helpers do dominio
- `api/routes_auth.py`: login, logout e troca de secretaria
- `api/routes_admin.py`: usuarios, secretarias, auditoria e exclusao administrativa
- `api/routes_certificates.py`: listagem, emissao e arquivos dos certificados
- `api/routes_public.py`: health, QR Code e validacao publica
- `api/certificate_sequences.py`: reserva atomica de codigos por prefixo e ano
- `api/models.py`: modelos de usuarios, secretarias e certificados
- `api/security.py`: hash de certificado e senha
- `api/schemas.py`: contratos da API
- `api/manage.py`: comandos de seed administrativo
- `api/migrations.py`, `api/alembic/`: migracoes versionadas do banco
- `api/templates/validacao.html`: pagina publica de validacao
- `api/static/style.css`: estilo da pagina de validacao

## Observacao de Evolucao

Se no futuro o objetivo for gerar o certificado completo no backend, sera necessario mover para a API:
- a composicao visual do layout
- a insercao de logo e assinatura
- a renderizacao do texto
- a geracao do PNG final

Hoje isso ainda nao acontece.
