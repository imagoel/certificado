# Frontend

O frontend continua em HTML, CSS e JavaScript puro, sem etapa de build.

Os scripts em `frontend/js/` sao carregados em ordem pelo `index.html`.
Eles compartilham o mesmo escopo global do navegador, por isso a ordem abaixo deve ser preservada:

1. `app-state.js`: referencias de DOM, constantes, estados e configuracoes iniciais.
2. `app-utils.js`: utilitarios gerais, API helpers, seletores, botoes e controles de preview.
3. `app-views.js`: renderizacao de tabelas, formularios, sessoes, relatorios e chamadas de carregamento.
4. `app-certificates-core.js`: registro, upload e descarte de certificados pendentes.
5. `app-canvas.js`: desenho do certificado, layout visual, QR Code e canvas.
6. `app-assets.js`: templates, logos, assinaturas, selos e controles visuais.
7. `app-spreadsheets.js`: leitura, normalizacao e validacao de planilhas.
8. `app-batch.js`: preview, confirmacao, geracao em lote, download e helpers de arquivo.
9. `app-bootstrap.js`: inicializacao da tela e registro dos eventos.

Para novas mudancas visuais, prefira mexer primeiro em `styles.css` e no HTML da secao afetada.
Para novas regras de comportamento, coloque a funcao no arquivo correspondente ao papel dela.
