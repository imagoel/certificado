# Sistema de Certificados

Aplicação interna para emissão, consulta, validação e administração de certificados digitais por secretaria.

## Visão Geral

O projeto está dividido em duas partes:

- **Frontend**: exige login, faz a pré-visualização do certificado no navegador, monta o PNG final em `canvas` e envia esse arquivo pronto para a API armazenar.
- **API**: autentica usuários, controla secretarias, gera o código oficial, gera o QR Code em PNG, valida certificados por código, guarda o PNG final e registra auditoria.

Resumo importante:

- o **QR Code** é gerado no backend
- o **PNG final do certificado** é gerado no frontend
- o backend **não renderiza o certificado inteiro**
- a tela inicial do gerador é **restrita por login**
- a validação em `/validar/{codigo}` continua **pública**

## Stack e Tecnologias

### Frontend

- HTML, CSS e JavaScript puro
- `canvas` para renderização do certificado
- `JSZip` para geração do arquivo `.zip` no lote
- `SheetJS/XLSX` para leitura de `.xlsx`, `.xls` e `.csv`

### Backend

- Python 3.12
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- HMAC-SHA256 para integridade dos certificados

### Infraestrutura

- Docker / Docker Compose
- Nginx para servir o frontend estático
- Portainer para deploy em produção
- Cloudflare Tunnel ou proxy reverso para publicação no domínio final

## Funcionalidades Implementadas

### Operação

- login obrigatório na página inicial
- sessão por cookie HTTP-only
- perfis `admin_global` e `operador`
- suporte a múltiplas secretarias
- seleção de secretaria ativa em sessão
- geração individual de certificado
- geração em lote por planilha
- download do PNG individual
- download do lote em `.zip`
- pré-visualização da planilha antes do lote
- confirmação antes de gerar lote
- retry automático no upload de PNG do lote
- alerta de possível duplicidade antes da geração individual
- reimpressão e visualização dos certificados já emitidos
- página pública de validação por QR Code

### Administração

- cadastro e edição de usuários
- vínculo de operador a uma ou mais secretarias
- secretarias inativas deixam de aparecer para vínculo de operadores
- cadastro, edição, ativação e desativação de secretarias
- exclusão administrativa de usuários
- exclusão administrativa de secretarias sem certificados emitidos
- exclusão administrativa de certificados com confirmação por código e senha do admin
- moldes por secretaria
- molde temporário por tela de geração
- auditoria de login, emissão, upload, exclusão e ações administrativas

### Segurança e Robustez

- limitação de tentativas de login
- proteção dos endpoints administrativos
- `/docs` protegida para admin ou desativável por ambiente
- lote limitado por `CERTIFICADOS_MAX_BATCH_ITEMS`
- geração automática de código com reserva atômica por `prefixo + ano`
- hashes novos em HMAC-SHA256
- compatibilidade com hashes legados em SHA-256
- bootstrap inicial validado no startup
- persistência de certificados e moldes em volumes Docker separados

## Arquitetura Atual

Fluxo da emissão individual:

1. o usuário faz login
2. o frontend envia os dados básicos para a API
3. a API reserva o próximo código oficial
4. a API devolve `codigo`, `url_validacao` e os metadados do certificado
5. o frontend solicita o PNG do QR Code
6. o frontend desenha o certificado completo em `canvas`
7. o frontend converte o `canvas` para PNG
8. o frontend envia o PNG final para a API
9. a API salva o arquivo e registra auditoria

Fluxo do lote:

1. o operador envia a planilha
2. o frontend normaliza os dados, mostra uma prévia e valida as linhas
3. a API registra o lote de certificados e reserva códigos oficiais
4. o frontend gera um PNG por certificado
5. o frontend tenta enviar cada PNG com retry
6. o frontend monta um `.zip` para download local
7. a API mantém os certificados e os PNGs que foram salvos com sucesso

## Multi-secretaria

O sistema já está preparado para:

- vincular usuários a uma ou mais secretarias
- gravar em cada certificado qual secretaria emitiu
- gravar qual usuário emitiu o certificado
- manter moldes por secretaria

Secretarias padrão do seed:

- `SESAU`
- `SEMED`
- `SEAFI`
- `SEAMA`
- `SEMOP`
- `SUGEP`

## Moldes de Certificado

O sistema trabalha com dois tipos de molde:

- **molde cadastrado da secretaria**: salvo no backend e administrado pelo `admin_global`
- **molde temporário**: carregado localmente pelo operador apenas para a geração atual

Regra importante:

- o molde funciona como **fundo do certificado**
- textos, QR Code, assinatura e logo continuam nas posições atuais
- o operador **não move o layout dos campos**

Formatos aceitos para moldes:

- `png`
- `jpg`
- `jpeg`
- `webp`

`svg` foi removido para evitar risco de XSS em arquivos servidos no mesmo domínio da aplicação.

## Geração em Lote

Formatos suportados:

- `.xlsx`
- `.xls`
- `.csv`

Colunas reconhecidas:

- obrigatória: `nome`
- opcionais: `sobrenome`, `curso`, `data`, `carga_h`, `linha1`, `linha2`, `arquivo`

Regras:

- se a planilha vier só com `nome`, os campos do formulário são usados como padrão
- colunas extras desconhecidas são ignoradas
- o sistema aceita cabeçalhos como `nome`, `NOME`, `Nome` e aliases conhecidos
- linhas totalmente vazias são ignoradas
- datas inválidas geram erro explícito por linha
- o lote respeita `CERTIFICADOS_MAX_BATCH_ITEMS`

## Auditoria

Eventos auditados incluem:

- login com sucesso
- login com falha
- login bloqueado
- certificado criado
- PNG enviado
- PNG acessado
- certificado excluído
- ações administrativas de usuários, secretarias e moldes

Observações:

- a auditoria é restrita a `admin_global`
- o frontend agora interpreta os horários vindos da API como UTC e exibe no horário local de `America/Sao_Paulo`
- a exclusão de certificado preserva o histórico anterior de auditoria

## Endpoints Principais

### Públicos

- `GET /health`
- `GET /api/qrcode?texto=...`
- `GET /api/validar/{codigo}`
- `GET /validar/{codigo}`
- `GET /api/certificados/{codigo}/arquivo`

### Autenticados

- `GET /api/auth/me`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/select-secretaria`
- `GET /api/certificados`
- `GET /api/certificados/possiveis-duplicados`
- `POST /api/certificados`
- `POST /api/certificados/lote`
- `POST /api/certificados/{codigo}/arquivo`

### Administrativos (`admin_global`)

- `GET /api/admin/secretarias`
- `POST /api/admin/secretarias`
- `PATCH /api/admin/secretarias/{id}`
- `DELETE /api/admin/secretarias/{id}`
- `GET /api/admin/usuarios`
- `POST /api/admin/usuarios`
- `PATCH /api/admin/usuarios/{id}`
- `DELETE /api/admin/usuarios/{id}`
- `GET /api/admin/auditoria`
- `GET /api/templates`
- `POST /api/templates`
- `PATCH /api/templates/{id}`
- `DELETE /api/templates/{id}`
- `GET /docs` (somente admin autenticado, se habilitado)
- `GET /openapi.json` (somente admin autenticado, se habilitado)

## Estrutura do Projeto

- `index.html`, `styles.css`, `app.js`: interface web, login, geração e administração
- `api/main.py`: bootstrap da aplicação FastAPI
- `api/common.py`: configuração compartilhada, helpers e dependências
- `api/routes_auth.py`: autenticação e troca de secretaria
- `api/routes_admin.py`: usuários, secretarias, auditoria e exclusões administrativas
- `api/routes_certificates.py`: emissão, listagem e arquivos dos certificados
- `api/routes_public.py`: `health`, QR Code e validação pública
- `api/routes_templates.py`: moldes por secretaria
- `api/certificate_sequences.py`: reserva atômica de códigos
- `api/models.py`: modelos SQLAlchemy
- `api/schemas.py`: contratos da API
- `api/security.py`: hashes e senha
- `api/manage.py`: comandos administrativos
- `api/migrations.py`, `api/alembic/`: migrações Alembic
- `api/templates/validacao.html`: página pública de validação
- `api/static/style.css`: estilo da página pública
- `tests/`: testes automatizados do backend

## Subindo Localmente

Use `.env.example` como base para o seu `.env`.

```bash
docker compose up -d --build
```

Serviços locais:

- frontend: `http://localhost:28754`
- API: `http://localhost:29180`
- PostgreSQL: `localhost:25432`

Volumes:

- `postgres_data`
- `certificados_media`
- `templates_media`

## Deploy com Portainer

Para produção:

- use `docker-compose.portainer.yml`
- mantenha o `.env` real fora do Git
- deixe `AUTO_SEED_SECRETARIAS=true`
- deixe `AUTO_BOOTSTRAP_ADMIN=true`
- informe `BOOTSTRAP_ADMIN_USERNAME` e `BOOTSTRAP_ADMIN_PASSWORD`

Fluxo recomendado com domínio público:

- `/` -> frontend
- `/api/*` -> API
- `/health` -> API
- `/validar/*` -> API
- `/static/*` -> API

Com isso:

- frontend e API ficam no mesmo domínio
- o frontend usa a mesma origem automaticamente em produção
- o QR Code aponta para `PUBLIC_VALIDATION_BASE_URL`

## Provisionamento Inicial

### Manual

```bash
docker exec certificado-api python manage.py seed-secretarias
docker exec certificado-api python manage.py create-admin --nome "Administrador Local" --username admin --password "troque-esta-senha"
```

### Automático

Use:

- `AUTO_SEED_SECRETARIAS=true`
- `AUTO_BOOTSTRAP_ADMIN=true`
- `BOOTSTRAP_ADMIN_NAME=Administrador`
- `BOOTSTRAP_ADMIN_USERNAME=admin`
- `BOOTSTRAP_ADMIN_PASSWORD=uma-senha-forte`

Com essa opção:

- as secretarias padrão são criadas se estiverem ausentes
- o admin inicial é criado automaticamente
- se faltarem `BOOTSTRAP_ADMIN_USERNAME` ou `BOOTSTRAP_ADMIN_PASSWORD`, a API falha no startup para evitar uma stack sem acesso administrativo

## Variáveis de Ambiente Importantes

Principais:

- `APP_ENV`
- `CODE_PREFIX`
- `PUBLIC_VALIDATION_BASE_URL`
- `CERTIFICADOS_MAX_UPLOAD_BYTES`
- `CERTIFICADOS_MAX_BATCH_ITEMS`
- `TEMPLATES_MEDIA_DIR`
- `TEMPLATES_MAX_UPLOAD_BYTES`
- `SESSION_SECRET`
- `CERTIFICATE_HASH_SECRET`
- `SESSION_COOKIE_NAME`
- `SESSION_SAME_SITE`
- `SESSION_HTTPS_ONLY`
- `SESSION_MAX_AGE_SECONDS`
- `ENABLE_ADMIN_DOCS`
- `TRUST_PROXY_HEADERS`
- `LOGIN_MAX_ATTEMPTS`
- `LOGIN_WINDOW_SECONDS`
- `LOGIN_BLOCK_SECONDS`
- `CORS_ALLOW_ORIGINS`
- `AUTO_SEED_SECRETARIAS`
- `AUTO_BOOTSTRAP_ADMIN`
- `BOOTSTRAP_ADMIN_NAME`
- `BOOTSTRAP_ADMIN_USERNAME`
- `BOOTSTRAP_ADMIN_PASSWORD`

Observações:

- em ambiente local, o frontend usa `localhost:29180` automaticamente
- em produção, se frontend e API estiverem no mesmo domínio, o frontend usa a mesma origem automaticamente
- `SESSION_SECRET` e `CERTIFICATE_HASH_SECRET` devem ser longos, exclusivos e estáveis
- para Cloudflare Tunnel ou proxy confiável, use `TRUST_PROXY_HEADERS=true`
- `ENABLE_ADMIN_DOCS=false` é o padrão recomendado para produção

## Cloudflare Tunnel / Teste de Domínio

Para teste local com domínio público:

- manter um `.env.cloudflare` fora do Git
- apontar `PUBLIC_VALIDATION_BASE_URL` para o domínio do tunnel
- incluir o domínio em `CORS_ALLOW_ORIGINS`
- rebuildar a stack com:

```bash
docker compose --env-file .env.cloudflare up -d --build
```

Exemplo de rotas do tunnel:

1. `^/api` -> `http://certificado-api:8000`
2. `^/health$` -> `http://certificado-api:8000`
3. `^/validar` -> `http://certificado-api:8000`
4. `^/static` -> `http://certificado-api:8000`
5. `*` -> `http://certificado-web:80`

## Testes Automatizados

Cobertura atual:

- autenticação e autorização
- criação e validação pública de certificados
- exclusão administrativa
- duplicidade
- lotes
- auditoria
- templates
- migrações Alembic
- compatibilidade entre hash legado e HMAC

Execução:

```bash
python3 -m pip install -r requirements-dev.txt
PYTHONPATH=api pytest -q
```

## Migrações

O projeto usa Alembic para versionar o banco.

Comando manual:

```bash
cd api
python3 manage.py migrate
```

Compatibilidade:

- bancos vazios sobem pela migration baseline
- bancos legados sem `alembic_version` são adotados no startup
- novas mudanças de schema devem entrar por revisão Alembic

## Limitações Conhecidas

- o backend não gera o certificado completo, apenas guarda o PNG final enviado pelo frontend
- o layout do certificado continua fixo; o molde só atua como fundo visual
- ainda não há personalização avançada de posições de texto por secretaria
- reimpressão e segunda via usam o certificado já salvo; a prevenção de duplicidade trabalha por alerta e confirmação, não por bloqueio absoluto

## Próximas Evoluções Naturais

- relatórios operacionais
- política de retenção/arquivamento da auditoria
- personalização visual mais avançada por secretaria
- testes automatizados adicionais no frontend
- maior refinamento de UX mobile conforme uso real
