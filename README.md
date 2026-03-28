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
- validar integridade por hash SHA-256
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

## Provisionamento Inicial

Depois de subir os containers, rode os seeds iniciais dentro do container da API:

```bash
docker exec certificado-api python manage.py seed-secretarias
docker exec certificado-api python manage.py create-admin --nome "Administrador Local" --username admin --password "troque-esta-senha"
```

Em seguida:
1. abra `http://localhost:28754`
2. entre com o usuario criado
3. escolha a secretaria ativa, se aparecer o seletor
4. use a aba `Certificados` para consultar e reimprimir os PNGs salvos
5. se estiver com perfil `admin_global`, use a aba `Administracao` para criar usuarios e secretarias
6. na mesma aba `Administracao`, acompanhe a trilha de auditoria do sistema

## Configuracao Local

Variaveis principais em `.env`:
- `CODE_PREFIX=ABC`
- `PUBLIC_VALIDATION_BASE_URL=http://localhost:29180/validar`
- `CERTIFICADOS_MAX_UPLOAD_BYTES=5242880`
- `SESSION_SECRET=troque-esta-chave-local`
- `CORS_ALLOW_ORIGINS=*`

Observacoes:
- o frontend usa `window.CERT_API_BASE_URL = "http://localhost:29180"` em `index.html`
- em producao, troque `PUBLIC_VALIDATION_BASE_URL` pelo dominio publico oficial
- em producao, troque `SESSION_SECRET` por uma chave longa e exclusiva

## Estrutura

- `index.html`, `styles.css`, `app.js`: login, interface, pre-visualizacao e geracao local do PNG final
- `api/main.py`: rotas da API e sessao autenticada
- `api/models.py`: modelos de usuarios, secretarias e certificados
- `api/security.py`: hash de certificado e senha
- `api/schemas.py`: contratos da API
- `api/manage.py`: comandos de seed administrativo
- `api/templates/validacao.html`: pagina publica de validacao
- `api/static/style.css`: estilo da pagina de validacao

## Observacao de Evolucao

Se no futuro o objetivo for gerar o certificado completo no backend, sera necessario mover para a API:
- a composicao visual do layout
- a insercao de logo e assinatura
- a renderizacao do texto
- a geracao do PNG final

Hoje isso ainda nao acontece.
