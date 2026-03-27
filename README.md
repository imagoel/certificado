# Sistema de Certificados

Projeto dividido em duas partes:
- **Frontend**: geração de certificados (individual e lote) em PNG + QR Code
- **API**: registro, hash SHA-256 e validação pública por código

## Frontend (já implementado)

### Funcionalidades
- geração individual de certificado em PNG
- QR Code sempre automático com URL oficial retornada pelo backend
- geração em lote por planilha (`.xlsx`, `.xls`, `.csv`)
- exportação do lote em `.zip`
- registro automático de certificados na API antes da geração do PNG
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
- o frontend consulta a API em `http://<host>:29180` por padrão (ou `window.CERT_API_BASE_URL`, se configurado)

### URL de validacao do QR (automatica)
- o operador nao precisa digitar URL no frontend
- por padrao, a API monta a URL de validacao automaticamente com base no host da requisicao
- em producao, se quiser fixar o dominio oficial da prefeitura, configure `PUBLIC_VALIDATION_BASE_URL` no backend (ex.: `https://certificados.prefeitura.gov.br/validar`)

### Configuracao atual (IP interno)
- frontend preconfigurado com `window.CERT_API_BASE_URL = "http://10.75.2.16:29180"` em `index.html`
- backend (compose) com `PUBLIC_VALIDATION_BASE_URL=http://10.75.2.16:29180/validar`

### Quando ativar Cloudflare Tunnel
- trocar `window.CERT_API_BASE_URL` no `index.html` para a URL HTTPS publica da API
- trocar `PUBLIC_VALIDATION_BASE_URL` no `docker-compose.yml` para a URL HTTPS publica de validacao
- manter `/validar` no final da base de validacao

## API (nova etapa)

### Stack
- FastAPI
- SQLAlchemy
- PostgreSQL
- Hash SHA-256 para integridade

### Endpoints
- `GET /health`
- `POST /api/certificados` (registro unitário)
- `POST /api/certificados/lote` (registro em lote)
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

## Estrutura

- `index.html`, `styles.css`, `app.js`: interface e geração local
- `api/main.py`: rotas da API
- `api/models.py`: modelo `certificados`
- `api/security.py`: hash e verificação
- `api/schemas.py`: contratos da API
- `api/templates/validacao.html`: página pública de validação
- `api/static/style.css`: estilo da página de validação

## Operação recomendada

Use sempre o frontend com a API ativa. Assim, cada certificado é registrado no banco com hash e o QR já sai apontando para a URL oficial de validação.
