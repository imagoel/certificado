# Frontend

O frontend continua em HTML, CSS e JavaScript puro, sem etapa de build.

Os scripts em `frontend/js/` sao carregados em ordem pelo `index.html`.
Eles compartilham o mesmo escopo global do navegador, por isso a ordem abaixo deve ser preservada:

1. `app-state.js`: referencias de DOM, constantes, estados e configuracoes iniciais.
2. `app-utils.js`: utilitarios gerais, API helpers, seletores, botoes e controles de preview.
3. `app-session-view.js`: sessao, login, status e dialogos principais.
4. `app-admin-view.js`: formularios administrativos e preenchimento de edicao.
5. `app-certificates-view.js`: tabela e relatorio CSV de certificados.
6. `app-audit-view.js`: filtros, CSV e impressao/PDF da auditoria.
7. `app-assets-view.js`: carregamentos, catalogos visuais, templates, assets e exclusoes administrativas.
8. `app-certificates-core.js`: registro, upload e descarte de certificados pendentes.
9. `app-canvas.js`: desenho do certificado, layout visual, QR Code e canvas.
10. `app-assets.js`: templates, logos, assinaturas, selos e controles visuais.
11. `app-spreadsheets.js`: leitura, normalizacao e validacao de planilhas.
12. `app-batch.js`: preview, confirmacao, geracao em lote, download e helpers de arquivo.
13. `app-bootstrap.js`: inicializacao da tela e registro dos eventos.

Os estilos em `frontend/css/` sao carregados em ordem pelo `index.html` e dependem da cascata.
Para novas mudancas visuais, prefira mexer no arquivo CSS correspondente ao dominio da tela e no HTML da secao afetada.
Para novas regras de comportamento, coloque a funcao no arquivo correspondente ao papel dela.
