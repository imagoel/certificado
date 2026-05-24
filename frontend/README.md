# Frontend

O frontend continua em HTML, CSS e JavaScript puro, sem etapa de build.

Os scripts em `frontend/js/` sao carregados em ordem pelo `index.html`.
Eles compartilham o mesmo escopo global do navegador, por isso a ordem abaixo deve ser preservada:

1. `app-state.js`: referencias de DOM, constantes, estados e configuracoes iniciais.
2. `app-utils.js`: utilitarios gerais, API helpers, seletores, botoes e controles de preview.
3. `app-views.js`: renderizacao de tabelas, formularios, sessoes, relatorios e chamadas de carregamento.
4. `app-certificates.js`: registro, upload, desenho do certificado, canvas e processamento de planilhas.
5. `app-bootstrap.js`: inicializacao da tela e registro dos eventos.

Para novas mudancas visuais, prefira mexer primeiro em `styles.css` e no HTML da secao afetada.
Para novas regras de comportamento, coloque a funcao no arquivo correspondente ao papel dela.
