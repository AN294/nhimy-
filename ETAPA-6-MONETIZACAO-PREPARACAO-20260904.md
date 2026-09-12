# Etapa 6 — Preparação de monetização — NHIMY Estudante 3.18

## Objetivo
Preparar a aplicação para monetização futura sem ativar publicidade prematuramente e sem inventar métricas ou receita.

## Implementado
- Camada cliente de consentimento para publicidade (`public/js/monetization.js`).
- Estado `granted`, `denied` ou `unknown` persistido localmente.
- Barreira única `canLoadAds()` exige configuração ativa **e** consentimento `granted` antes de qualquer futura carga publicitária.
- Placeholder visual de publicidade marcado como preparado, não ativado.
- Configuração server-side por ambiente: `NHIMY_AD_PROVIDER`, `NHIMY_AD_PUBLISHER_ID` e `NHIMY_ADS_ENABLED`.
- Endpoint administrativo `/api/admin/monetization` protegido por papel `admin`.
- O endpoint só considera monetização ativa quando fornecedor, identificador e flag de ativação estão configurados.
- Métricas do fornecedor permanecem explicitamente indisponíveis até existir integração real.
- O painel administrativo mostra o estado real da configuração.

## Segurança
Nenhum identificador de fornecedor é exposto ao estudante por API pública. Nenhum anúncio de produção é carregado nesta etapa. O consentimento continua obrigatório para a futura camada publicitária.

## Validação
Suíte de certificação anterior: 131 testes aprovados, 0 falhas. A alteração de preparação de monetização acrescenta uma verificação específica da barreira de consentimento.
