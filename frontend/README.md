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
14. `app-session-view.js`: renderizacao e atualizacao da sessao autenticada.
15. `app-status-helpers.js`: helpers de mensagens de status por tela/dialogo.
16. `app-dialogs.js`: dialogos de confirmacao, exclusao, reenvio, lixeira, duplicidade e lote.
17. `app-session-reset.js`: limpeza da interface ao encerrar ou expirar sessao.
18. `app-admin-view.js`: formularios administrativos e preenchimento de edicao.
19. `app-certificate-email-status.js`: estado e badge de envio de e-mail dos certificados.
20. `app-action-menu.js`: posicionamento e fechamento dos menus de acoes.
21. `app-certificate-report.js`: relatorio CSV da listagem de certificados.
22. `app-certificates-view.js`: tabela, selecao e acoes principais de certificados.
23. `app-admin-tables.js`: tabelas de usuarios, secretarias, moldes e itens visuais.
24. `app-audit-table.js`: linhas da tabela de auditoria e estado dos botoes de relatorio.
25. `app-list-loaders.js`: carregamento das listagens de Certificados e Auditoria.
26. `app-admin-data.js`: carregamento administrativo e exclusoes de usuarios/secretarias.
27. `app-audit-view.js`: filtros, CSV e impressao/PDF da auditoria.
28. `app-forms-view.js`: helpers comuns e troca entre criar/gerenciar formularios.
29. `app-forms-builder.js`: criacao, edicao e campos extras dos formularios.
30. `app-forms-list.js`: tabela, acoes e carregamento da lista de formularios.
31. `app-form-responses.js`: respostas, exportacao, QR Code e carga para geracao.
32. `app-assets-view.js`: catalogos visuais, templates, assets e exclusoes visuais.
33. `app-layout-presets.js`: layouts salvos da secretaria e aplicacao na previa.
34. `app-certificates-core.js`: recarregamento de dados protegidos e catalogos do gerador.
35. `app-certificate-upload.js`: upload de PNG, retry e helpers de espera.
36. `app-pending-certificates.js`: descarte e limpeza de certificados pendentes.
37. `app-certificate-generation.js`: preparacao, registro e geracao individual/lote.
38. `app-certificate-edit.js`: modo de edicao admin e salvamento seguro.
39. `app-canvas.js`: desenho do certificado, layout visual, QR Code e canvas.
40. `app-assets.js`: templates, logos, assinaturas, selos e controles visuais.
41. `app-spreadsheets.js`: leitura, normalizacao e validacao de planilhas.
42. `app-batch-utils.js`: helpers de arquivo, PNG, download e timestamp.
43. `app-batch-preview.js`: botoes, estado e renderizacao da previa do lote.
44. `app-batch.js`: preparacao, confirmacao e geracao em lote.
45. `events/generator-events.js`: eventos do formulario principal, campos de texto e download.
46. `events/preview-events.js`: eventos da previa e dos controles de layout.
47. `events/asset-events.js`: eventos de upload, selecao e remocao de itens visuais.
48. `events/batch-events.js`: eventos de planilha, previa e confirmacao de lote.
49. `events/section-events.js`: eventos das abas principais e subtabs administrativas.
50. `events/listing-events.js`: eventos de Certificados e Auditoria.
51. `events/forms-events.js`: eventos de criacao, listagem e respostas de formularios.
52. `events/admin-events.js`: eventos dos formularios administrativos.
53. `events/session-events.js`: login, logout e troca de secretaria ativa.
54. `events/dialog-events.js`: dialogos de duplicidade e exclusao.
55. `events/startup.js`: sincronizacao inicial da interface.
56. `app-bootstrap.js`: checagem minima e chamada dos registros de eventos.

Os estilos em `frontend/css/` sao carregados em ordem pelo `index.html` e dependem da cascata.
Para novas mudancas visuais, prefira mexer no arquivo CSS correspondente ao dominio da tela e no HTML da secao afetada.
Para novas regras de comportamento, coloque a funcao no arquivo correspondente ao papel dela.
