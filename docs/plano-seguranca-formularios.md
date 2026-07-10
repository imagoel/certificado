# Plano de seguranca e formularios

## Seguranca

Prioridade rapida:

- Evitar envio de segredos no contexto Docker com `.dockerignore`.
- Validar uploads de imagem pelo conteudo real do arquivo, nao apenas extensao ou `Content-Type`.
- Adicionar headers basicos de seguranca na API e no frontend.

Proximas etapas:

- Adicionar CSRF token para rotas autenticadas que alteram dados.
- Adicionar token publico aleatorio nos links/QR Codes de certificados para reduzir enumeracao por codigo sequencial.
- Revisar exposicao direta da API e confiar em `X-Forwarded-For` apenas quando a API estiver isolada atras do proxy.

## Formularios

Objetivo:

- Criar uma aba de formularios para coletar dados de participantes sem depender de planilha externa.
- A tela deve ser simples e nao deve virar um segundo gerador de certificados.

Dados internos do formulario:

- Curso vinculado.
- Carga horaria.
- Data de conclusao.
- Secretaria responsavel.
- Email de resposta.
- Status ativo/inativo.
- Token publico do formulario.
- Usuario que criou o formulario.

Dados publicos preenchidos pelo participante:

- Nome completo.
- Email, se configurado.
- Campos extras simples, como secretaria/setor, cargo, matricula, telefone ou observacao.

Fluxo desejado:

- Operador cria o formulario.
- Sistema gera link publico e QR Code para divulgacao.
- Participantes preenchem o formulario.
- Operador visualiza respostas, exporta relatorio e seleciona respostas para gerar certificados.
- Ao clicar em gerar certificados, o sistema leva para a tela Gerar em modo lote, com os dados ja carregados para revisao e ajuste do certificado antes da emissao.
