# Sistema de Certificados

Projeto dividido em duas partes:
- **Frontend**: monta o certificado no navegador, faz a pré-visualização em `canvas` e exporta o PNG final.
- **API**: registra certificados, gera o QR Code em PNG, valida por código e armazena o arquivo final enviado pelo frontend.

## Arquitetura Atual

Fluxo atual:
1. o frontend envia os dados do certificado para a API
2. a API gera o código oficial e a URL de validação
3. o frontend solicita à API a imagem PNG do QR Code
4. o frontend desenha o certificado completo no `canvas`
5. o frontend converte o `canvas` para PNG
6. o frontend envia esse PNG final para a API armazenar

Resumo importante:
- o **QR Code** é gerado no backend
- o **PNG final do certificado** é gerado no frontend
- o backend **não desenha o certificado completo** hoje; ele apenas recebe e salva o PNG pronto

## Frontend

### Funcionalidades
- geração individual de certificado em PNG no navegador
- geração em lote por planilha (`.xlsx`, `.xls`, `.csv`)
- exportação do lote em `.zip`
- registro automático de certificados na API antes da geração do PNG
- uso automático do QR Code oficial retornado pela API
- upload automático do PNG final para armazenamento no servidor
- visualização do certificado salvo na página pública de validação
- sem campo manual para URL de validação ou conteúdo do QR

### Colunas da planilha
- obrigatória: `nome` (ou `nome` + `sobrenome` em colunas separadas)
- opcionais: `curso`, `data`, `linha1`, `linha2`, `arquivo`
- modelo mínimo recomendado: apenas a coluna `nome`

Regras:
- se planilha vier só com `nome`, os campos do formulário (`curso`, `data` e textos) são usados como padrão para todos os alunos
- se planilha vier com `nome` e `sobrenome`, o sistema concatena automaticamente para formar o nome completo
- o código do certificado é sempre gerado pelo backend
- a URL do QR é sempre definida pelo backend (campo `url_validacao` da API)
- a imagem do QR Code é gerada pela API (`GET /api/qrcode`)
- o arquivo PNG final é gerado no frontend e enviado automaticamente para o backend após a geração
- o frontend consulta a API em `http://<host>:29180` por padrão (ou `window.CERT_API_BASE_URL`, se configurado)

### URL de validacao do QR (automatica)
- o operador nao precisa digitar URL no frontend
- por padrao, a API monta a URL de validacao automaticamente com base no host da requisicao
- em producao, se quiser fixar o dominio oficial da prefeitura, configure `PUBLIC_VALIDATION_BASE_URL` no backend (ex.: `https://certificados.prefeitura.gov.br/validar`)

### Configuração atual (local)
- frontend preconfigurado com `window.CERT_API_BASE_URL = "http://localhost:29180"` em `index.html`
- backend (compose) com `PUBLIC_VALIDATION_BASE_URL=http://localhost:29180/validar`

### Quando ativar Cloudflare Tunnel
- trocar `window.CERT_API_BASE_URL` no `index.html` para a URL HTTPS publica da API
- trocar `PUBLIC_VALIDATION_BASE_URL` no `docker-compose.yml` para a URL HTTPS publica de validacao
- manter `/validar` no final da base de validacao

## API (nova etapa)

### Responsabilidades
- registrar certificados e gerar códigos oficiais
- gerar o PNG do QR Code usado pelo frontend
- validar integridade por hash SHA-256
- armazenar e servir o PNG final do certificado

### Stack
- FastAPI
- SQLAlchemy
- PostgreSQL
- Hash SHA-256 para integridade

### Endpoints
- `GET /health`
- `GET /api/qrcode?texto=...` (gera o PNG do QR Code para o frontend)
- `POST /api/certificados` (registro unitário)
- `POST /api/certificados/lote` (registro em lote)
- `POST /api/certificados/{codigo}/arquivo` (upload do PNG)
- `GET /api/certificados/{codigo}/arquivo` (download/visualização do PNG)
- `GET /api/validar/{codigo}` (JSON)
- `GET /validar/{codigo}` (página HTML pública)

## Subindo com Docker Compose

```bash
docker compose up -d --build
```

Serviços:
- Frontend: `http://localhost:28754`
- API: `http://localhost:29180`
- PostgreSQL: `localhost:25432`

Volumes:
- `postgres_data`: dados do banco
- `certificados_media`: arquivos PNG salvos no servidor (`/app/data/certificados` no container da API)

## Estrutura

- `index.html`, `styles.css`, `app.js`: interface, pré-visualização e geração local do PNG final
- `api/main.py`: rotas da API
- `api/models.py`: modelo `certificados`
- `api/security.py`: hash e verificação
- `api/schemas.py`: contratos da API
- `api/templates/validacao.html`: página pública de validação
- `api/static/style.css`: estilo da página de validação

## Observação de evolução

Se no futuro o objetivo for gerar o certificado completo no backend, será necessário mover para a API:
- a composição visual do layout
- a inserção de logo e assinatura
- a renderização do texto
- a geração do PNG final

Hoje isso ainda não acontece.

## Operação recomendada

Use sempre o frontend com a API ativa. Assim, cada certificado é registrado no banco com hash, o PNG é armazenado no servidor e o QR aponta para a validação pública com opção de visualizar o arquivo.
