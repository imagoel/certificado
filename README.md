# Sistema de Certificados

Aplicacao interna para emissao, consulta, validacao e administracao de certificados digitais por secretaria.

## Visao Geral

O projeto esta dividido em duas partes:

- **Frontend**: exige login, faz a pre-visualizacao do certificado no navegador, monta o PNG final em `canvas` e envia esse arquivo pronto para a API armazenar.
- **API**: autentica usuarios, controla secretarias, gera o codigo oficial, gera o QR Code em PNG, valida certificados por codigo, guarda o PNG final e registra auditoria.

Resumo importante:

- o **QR Code** e gerado no backend
- o **PNG final do certificado** e gerado no frontend
- o backend **nao renderiza o certificado inteiro**
- a tela inicial do gerador e **restrita por login**
- a validacao em `/validar/{codigo}` continua **publica**

## Stack e Tecnologias

### Frontend

- HTML, CSS e JavaScript puro
- `canvas` para renderizacao do certificado
- `JSZip` para geracao do arquivo `.zip` no lote
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
- Nginx para servir o frontend estatico
- Portainer para deploy em producao
- Cloudflare Tunnel ou proxy reverso para publicacao no dominio final

## Funcionalidades Implementadas

### Operacao

- login obrigatorio na pagina inicial
- sessao por cookie HTTP-only
- perfis `admin_global` e `operador`
- suporte a multiplas secretarias
- selecao de secretaria ativa em sessao
- geracao individual de certificado
- geracao em lote por planilha
- download do PNG individual
- download do lote em `.zip`
- pre-visualizacao da planilha antes do lote
- confirmacao antes de gerar lote
- retry automatico no upload de PNG do lote
- certificados ficam pendentes ate o PNG ser salvo
- descarte automatico de certificados pendentes quando o PNG falha
- alerta de possivel duplicidade antes da geracao individual
- filtros rapidos em `Certificados` e `Auditoria`
- reimpressao e visualizacao dos certificados ja emitidos
- pagina publica de validacao por QR Code

### Administracao

- cadastro e edicao de usuarios
- vinculo de operador a uma ou mais secretarias
- `admin_global` acessa todas as secretarias e nao mantem vinculos salvos
- secretarias inativas deixam de aparecer para vinculo de operadores
- cadastro, edicao, ativacao e desativacao de secretarias
- exclusao administrativa de usuarios
- exclusao administrativa de secretarias sem certificados emitidos
- exclusao administrativa de certificados com confirmacao por codigo e senha do admin
- moldes por secretaria
- logos por secretaria
- assinaturas por secretaria
- molde temporario por tela de geracao
- logo temporaria por tela de geracao
- assinatura temporaria por tela de geracao
- aba propria de auditoria visivel apenas para `admin_global`
- auditoria de login, emissao, upload, exclusao e acoes administrativas

### Seguranca e Robustez

- limitacao de tentativas de login
- protecao dos endpoints administrativos
- `/docs` protegida para admin ou desativavel por ambiente
- lote limitado por `CERTIFICADOS_MAX_BATCH_ITEMS`
- geracao automatica de codigo com reserva atomica por `prefixo + ano`
- hashes novos em HMAC-SHA256
- compatibilidade com hashes legados em SHA-256
- bootstrap inicial validado no startup
- persistencia de certificados e assets visuais em volumes Docker persistentes

## Arquitetura Atual

Fluxo da emissao individual:

1. o usuario faz login
2. o frontend envia os dados basicos para a API
3. a API reserva o proximo codigo oficial
4. a API devolve `codigo`, `url_validacao` e os metadados do certificado
5. o frontend solicita o PNG do QR Code
6. o frontend desenha o certificado completo em `canvas`
7. o frontend converte o `canvas` para PNG
8. o frontend envia o PNG final para a API
9. a API marca o certificado como ativo apenas apos salvar o arquivo e registrar auditoria

Fluxo do lote:

1. o operador envia a planilha
2. o frontend detecta o cabecalho, normaliza os dados, mostra a previa e valida as linhas
3. a API registra o lote de certificados como pendentes e reserva codigos oficiais
4. o frontend gera um PNG por certificado valido
5. o frontend tenta enviar cada PNG com retry
6. a API ativa apenas os certificados cujo PNG foi salvo com sucesso
7. pendentes que falham no PNG sao descartados automaticamente sempre que possivel
8. o frontend monta um `.zip` apenas com os certificados concluidos

## Multi-secretaria

O sistema ja esta preparado para:

- vincular usuarios a uma ou mais secretarias
- gravar em cada certificado qual secretaria emitiu
- gravar qual usuario emitiu o certificado
- manter moldes por secretaria
- manter logos e assinaturas por secretaria

Secretarias padrao do seed:

- `SESAU`
- `SEMED`
- `SEAFI`
- `SEAMA`
- `SEMOP`
- `SUGEP`

## Moldes de Certificado

O sistema trabalha com dois tipos de molde:

- **molde cadastrado da secretaria**: salvo no backend e administrado pelo `admin_global`
- **molde temporario**: carregado localmente pelo operador apenas para a geracao atual

Regra importante:

- o molde funciona como **fundo do certificado**
- textos, QR Code, assinatura e logo continuam nas posicoes atuais
- o operador **nao move o layout dos campos**

Formatos aceitos para moldes:

- `png`
- `jpg`
- `jpeg`
- `webp`

`svg` foi removido para evitar risco de XSS em arquivos servidos no mesmo dominio da aplicacao.

## Logos e Assinaturas por Secretaria

O sistema tambem permite catalogos persistidos de:

- **logos por secretaria**
- **assinaturas por secretaria**

Funcionamento:

- o `admin_global` cadastra os arquivos aprovados da secretaria
- cada secretaria pode ter um item padrao
- ao selecionar a secretaria ativa, o gerador carrega automaticamente o molde, a logo e a assinatura padrao
- o operador pode trocar para outro item aprovado da mesma secretaria
- uploads manuais na tela continuam valendo como sobrescrita temporaria apenas para aquela geracao

Formatos aceitos:

- `png`
- `jpg`
- `jpeg`
- `webp`

## Geracao em Lote

Formatos suportados:

- `.xlsx`
- `.xls`
- `.csv`

Colunas reconhecidas:

- obrigatoria: `nome`
- opcionais: `sobrenome`, `curso`, `data`, `carga_h`, `linha1`, `linha2`, `arquivo`

Regras:

- o sistema detecta automaticamente a linha de cabecalho nas primeiras linhas da planilha
- se a planilha vier so com `nome`, os campos do formulario sao usados como padrao
- colunas extras desconhecidas sao ignoradas
- o sistema aceita cabecalhos como `nome`, `NOME`, `Nome` e aliases conhecidos
- linhas totalmente vazias sao ignoradas
- linhas sem `NOME` sao ignoradas no lote
- nomes com caracteres de lixo no inicio sao saneados sem perder acentos validos
- datas invalidas geram erro explicito por linha
- o lote respeita `CERTIFICADOS_MAX_BATCH_ITEMS`

## Auditoria

Eventos auditados incluem:

- login com sucesso
- login com falha
- login bloqueado
- certificado criado
- PNG enviado
- PNG acessado
- certificado excluido
- acoes administrativas de usuarios, secretarias, moldes, logos e assinaturas

Observacoes:

- a auditoria e restrita a `admin_global`
- o frontend interpreta os horarios vindos da API como UTC e exibe no horario local de `America/Sao_Paulo`
- a exclusao de certificado preserva o historico anterior de auditoria

## Endpoints Principais

### Publicos

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
- `GET /api/templates`
- `GET /api/secretaria-assets`
- `GET /api/secretaria-assets/{id}/arquivo`

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
- `GET /api/admin/templates`
- `POST /api/admin/templates`
- `PATCH /api/admin/templates/{id}`
- `DELETE /api/admin/templates/{id}`
- `GET /api/admin/secretaria-assets`
- `POST /api/admin/secretaria-assets`
- `PATCH /api/admin/secretaria-assets/{id}`
- `DELETE /api/admin/secretaria-assets/{id}`
- `GET /docs` (somente admin autenticado, se habilitado)
- `GET /openapi.json` (somente admin autenticado, se habilitado)

## Estrutura do Projeto

- `index.html`, `styles.css`, `app.js`: interface web, login, geracao e administracao
- `api/main.py`: bootstrap da aplicacao FastAPI
- `api/common.py`: configuracao compartilhada, helpers e dependencias
- `api/routes_auth.py`: autenticacao e troca de secretaria
- `api/routes_admin.py`: usuarios, secretarias, auditoria e exclusoes administrativas
- `api/routes_certificates.py`: emissao, listagem e arquivos dos certificados
- `api/routes_public.py`: `health`, QR Code e validacao publica
- `api/routes_templates.py`: moldes por secretaria
- `api/routes_secretaria_assets.py`: logos e assinaturas por secretaria
- `api/certificate_sequences.py`: reserva atomica de codigos
- `api/models.py`: modelos SQLAlchemy
- `api/schemas.py`: contratos da API
- `api/security.py`: hashes e senha
- `api/manage.py`: comandos administrativos
- `api/migrations.py`, `api/alembic/`: migracoes Alembic
- `api/templates/validacao.html`: pagina publica de validacao
- `api/static/style.css`: estilo da pagina publica
- `tests/`: testes automatizados do backend

## Subindo Localmente

Use `.env.example` como base para o seu `.env`.

```bash
docker compose up -d --build
```

Servicos locais:

- frontend: `http://localhost:28754`
- API: `http://localhost:29180`
- PostgreSQL: `localhost:25432`

Volumes:

- `postgres_data`
- `certificados_media`
- `templates_media`

## Deploy com Portainer

Para producao:

- use `docker-compose.yml`
- mantenha o `.env` real fora do Git
- deixe `AUTO_SEED_SECRETARIAS=true`
- deixe `AUTO_BOOTSTRAP_ADMIN=true`
- informe `BOOTSTRAP_ADMIN_USERNAME` e `BOOTSTRAP_ADMIN_PASSWORD`

Fluxo recomendado com dominio publico:

- `/` -> frontend
- `/api/*` -> API
- `/health` -> API
- `/validar/*` -> API
- `/static/*` -> API

Com isso:

- frontend e API ficam no mesmo dominio
- o frontend usa a mesma origem automaticamente em producao
- o QR Code aponta para `PUBLIC_VALIDATION_BASE_URL`

## Provisionamento Inicial

### Manual

```bash
docker exec certificado-api python manage.py seed-secretarias
docker exec certificado-api python manage.py create-admin --nome "Administrador Local" --username admin --password "troque-esta-senha"
```

### Automatico

Use:

- `AUTO_SEED_SECRETARIAS=true`
- `AUTO_BOOTSTRAP_ADMIN=true`
- `BOOTSTRAP_ADMIN_NAME=Administrador`
- `BOOTSTRAP_ADMIN_USERNAME=admin`
- `BOOTSTRAP_ADMIN_PASSWORD=uma-senha-forte`

Com essa opcao:

- as secretarias padrao sao criadas se estiverem ausentes
- o admin inicial e criado automaticamente
- se faltarem `BOOTSTRAP_ADMIN_USERNAME` ou `BOOTSTRAP_ADMIN_PASSWORD`, a API falha no startup para evitar uma stack sem acesso administrativo

## Variaveis de Ambiente Importantes

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

Observacoes:

- em ambiente local, o frontend usa `localhost:29180` automaticamente
- em producao, se frontend e API estiverem no mesmo dominio, o frontend usa a mesma origem automaticamente
- `SESSION_SECRET` e `CERTIFICATE_HASH_SECRET` devem ser longos, exclusivos e estaveis
- para Cloudflare Tunnel ou proxy confiavel, use `TRUST_PROXY_HEADERS=true`
- `ENABLE_ADMIN_DOCS=false` e o padrao recomendado para producao

## Cloudflare Tunnel / Teste de Dominio

Para teste local com dominio publico:

- mantenha um `.env.cloudflare` fora do Git
- aponte `PUBLIC_VALIDATION_BASE_URL` para o dominio do tunnel
- inclua o dominio em `CORS_ALLOW_ORIGINS`
- rebuild a stack com:

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

- autenticacao e autorizacao
- criacao e validacao publica de certificados
- exclusao administrativa
- duplicidade
- lotes
- auditoria
- templates
- logos e assinaturas por secretaria
- migracoes Alembic
- compatibilidade entre hash legado e HMAC

Execucao:

```bash
python3 -m pip install -r requirements-dev.txt
PYTHONPATH=api pytest -q
```

## Migracoes

O projeto usa Alembic para versionar o banco.

Comando manual:

```bash
cd api
python3 manage.py migrate
```

Compatibilidade:

- bancos vazios sobem pela migration baseline
- bancos legados sem `alembic_version` sao adotados no startup
- novas mudancas de schema devem entrar por revisao Alembic

## Limitacoes Conhecidas

- o backend nao gera o certificado completo, apenas guarda o PNG final enviado pelo frontend
- o layout do certificado continua fixo; o molde so atua como fundo visual
- ainda nao ha personalizacao avancada de posicoes de texto por secretaria
- reimpressao e segunda via usam o certificado ja salvo; a prevencao de duplicidade trabalha por alerta e confirmacao, nao por bloqueio absoluto

## Refinamentos de UX Recentes

- o gerador foi reorganizado em:
  - `Dados do certificado`
  - `Textos customizaveis`
- a tela de auditoria saiu da aba `Certificados` e ganhou aba propria
- a tabela de certificados ficou mais compacta em telas pequenas, com detalhes secundarios embutidos na celula principal
- `Molde`, `Logo` e `Assinatura` foram simplificados em tres blocos mais enxutos, com sobrescrita temporaria apenas quando necessario
- `Ajustes avancados de logo e assinatura` ficam recolhidos por padrao
- o foco visual de inputs, botoes e controles foi reforcado para melhorar navegacao por teclado

## Proximas Evolucoes Naturais

- relatorios operacionais
- politica de retencao/arquivamento da auditoria
- personalizacao visual mais avancada por secretaria
- testes automatizados adicionais no frontend
- maior refinamento de UX mobile conforme uso real

## Deploy no Portainer

O repositorio agora trabalha com um unico arquivo de stack:

- use `docker-compose.yml`

Recomendacao:

- preencha as variaveis de ambiente da producao diretamente no Portainer
- mantenha o `.env` de producao fora do Git
- para Cloudflare Tunnel, prefira usar o IP privado do host quando houver instabilidade no DNS interno do Docker

Exemplo de rotas por IP:

1. `^/api` -> `http://10.75.2.16:29180`
2. `^/health$` -> `http://10.75.2.16:29180`
3. `^/validar` -> `http://10.75.2.16:29180`
4. `^/static` -> `http://10.75.2.16:29180`
5. `*` -> `http://10.75.2.16:28754`
