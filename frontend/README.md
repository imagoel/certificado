# Frontend

O frontend continua em HTML, CSS e JavaScript puro, sem etapa de build.

Os scripts em `frontend/js/` sao carregados em ordem pelo `index.html`.
Eles compartilham o mesmo escopo global do navegador, por isso a ordem abaixo deve ser preservada:

1. `state/app-dom.js`: referencias de DOM e canvas.
2. `state/app-layout-state.js`: constantes e layout ajustavel da previa.
3. `state/app-runtime-state.js`: flags, sessao, dados pendentes e aliases de planilha.
4. `state/app-catalog-state.js`: assets locais, assets cadastrados e catalogos visuais.
5. `state/app-list-state.js`: estados de listagens, administracao e formatacao de data/hora.
6. `app-utils.js`: utilitarios gerais pequenos, como datas, texto e tamanho de arquivo.
7. `app-api.js`: base da API, requests JSON/FormData, query string e limite de PNG.
8. `app-filters.js`: estado dos filtros de Certificados e Auditoria.
9. `app-status.js`: helpers de mensagens de status.
10. `app-asset-utils.js`: helpers de catalogos visuais, assets ativos e labels.
11. `app-preview-adjust.js`: hotspots e painel de ajuste da previa.
12. `app-navigation.js`: troca de telas, modulos administrativos, selects e checklists.
13. `app-ui.js`: botoes e icones criados via JavaScript.
14. `app-session-view.js`: sessao, login, status e dialogos principais.
15. `app-admin-view.js`: formularios administrativos e preenchimento de edicao.
16. `app-certificates-view.js`: tabela e relatorio CSV de certificados.
17. `app-admin-tables.js`: tabelas de usuarios, secretarias, moldes e itens visuais.
18. `app-audit-table.js`: linhas da tabela de auditoria e estado dos botoes de relatorio.
19. `app-list-loaders.js`: carregamento das listagens de Certificados e Auditoria.
20. `app-admin-data.js`: carregamento administrativo e exclusoes de usuarios/secretarias.
21. `app-audit-view.js`: filtros, CSV e impressao/PDF da auditoria.
22. `app-forms-view.js`: helpers comuns e troca entre criar/gerenciar formularios.
23. `app-forms-builder.js`: criacao, edicao e campos extras dos formularios.
24. `app-forms-list.js`: tabela, acoes e carregamento da lista de formularios.
25. `app-form-responses.js`: respostas, exportacao, QR Code e carga para geracao.
26. `app-assets-view.js`: catalogos visuais, templates, assets e exclusoes visuais.
27. `app-layout-presets.js`: layouts salvos da secretaria e aplicacao na previa.
28. `app-certificates-core.js`: recarregamento de dados protegidos e catalogos do gerador.
29. `app-certificate-upload.js`: upload de PNG, retry e helpers de espera.
30. `app-pending-certificates.js`: descarte e limpeza de certificados pendentes.
31. `app-certificate-generation.js`: preparacao, registro e geracao individual/lote.
32. `app-certificate-edit.js`: modo de edicao admin e salvamento seguro.
33. `app-canvas.js`: desenho do certificado, layout visual, QR Code e canvas.
34. `app-assets.js`: templates, logos, assinaturas, selos e controles visuais.
35. `app-spreadsheets.js`: leitura, normalizacao e validacao de planilhas.
36. `app-batch.js`: preview, confirmacao, geracao em lote, download e helpers de arquivo.
37. `events/generator-events.js`: eventos do formulario principal, campos de texto e download.
38. `events/preview-events.js`: eventos da previa e dos controles de layout.
39. `events/asset-events.js`: eventos de upload, selecao e remocao de itens visuais.
40. `events/batch-events.js`: eventos de planilha, previa e confirmacao de lote.
41. `events/section-events.js`: eventos das abas principais e subtabs administrativas.
42. `events/listing-events.js`: eventos de Certificados e Auditoria.
43. `events/forms-events.js`: eventos de criacao, listagem e respostas de formularios.
44. `events/admin-events.js`: eventos dos formularios administrativos.
45. `events/session-events.js`: login, logout e troca de secretaria ativa.
46. `events/dialog-events.js`: dialogos de duplicidade e exclusao.
47. `events/startup.js`: sincronizacao inicial da interface.
48. `app-bootstrap.js`: checagem minima e chamada dos registros de eventos.

Os estilos em `frontend/css/` sao carregados em ordem pelo `index.html` e dependem da cascata.
Para novas mudancas visuais, prefira mexer no arquivo CSS correspondente ao dominio da tela e no HTML da secao afetada.
Para novas regras de comportamento, coloque a funcao no arquivo correspondente ao papel dela.
