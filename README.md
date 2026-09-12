# NHIMY Estudante 3.18

Projeto web modular para apoio ao estudante, com Estudar, Trabalhos, Organizar, Ferramentas, Biblioteca, autenticação e administração protegida.

## Execução

```bash
npm install
npm start
```

## Testes

```bash
npm test
```

## Persistência PostgreSQL

```bash
npm run preflight:postgres
npm run db:migrate
```

As validações reais de PostgreSQL/deploy devem ser executadas no ambiente correspondente antes da publicação.

## Segurança

O painel administrativo e as APIs administrativas exigem sessão autenticada e papel `admin`.

## Monetização — estado seguro

A monetização do NHIMY fica **preparada, mas desativada por padrão**.

- `NHIMY_AD_PROVIDER`: fornecedor futuro (não exposto ao estudante).
- `NHIMY_AD_PUBLISHER_ID`: identificador do fornecedor, configurado apenas no servidor.
- `NHIMY_ADS_ENABLED=1`: só deve ser usado depois da aprovação/configuração externa.
- O carregamento futuro também exige consentimento explícito (`granted`).
- Sem fornecedor + publisher ID + flag ativa + consentimento, nenhum anúncio é carregado.
- Métricas de receita permanecem indisponíveis até existir integração real com o fornecedor.

Não colocar IDs reais ou chaves de fornecedores no código público, no Git ou no pacote distribuído.
