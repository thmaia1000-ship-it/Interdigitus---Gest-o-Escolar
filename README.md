# Interdigitus - Sistema Integrado de Gestão Escolar

> Sistema web full-stack de gestão acadêmica, financeira, comercial e administrativa baseado rigorosamente no esquema relacional MySQL `dbinterdigitus`.

![Interdigitus Status](https://img.shields.io/badge/status-operacional-success)
![Node.js](https://img.shields.io/badge/node-%3E%3D20-blue)
![React](https://img.shields.io/badge/react-19-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)
![MySQL](https://img.shields.io/badge/database-MySQL%208.x-orange)

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Cobertura Operacional das 18 Tabelas](#-cobertura-operacional-das-18-tabelas)
- [Controle de Acesso Baseado em Perfis (RBAC)](#-controle-de-acesso-baseado-em-perfis-rbac)
- [Regras de Negócio e Integridade](#-regras-de-negócio-e-integridade)
- [Instalação e Execução](#-instalação-e-execução)
- [Configuração do Banco MySQL](#-configuração-do-banco-mysql)
- [Instruções para Publicação no GitHub](#-instruções-para-publicação-no-github)

---

## 🎯 Visão Geral

O **Interdigitus** foi desenvolvido para transformar o banco legado `dbinterdigitus` em uma ferramenta moderna, rápida e responsiva para a operação diária de escolas técnicas e centros de formação profissional, atendendo:
- **Secretaria**: matrículas, prontuário acadêmico de alunos, responsáveis legais e controle de turmas.
- **Coordenação Pedagógica**: cursos técnicos, cursos livres/extensão, disciplinas e notas/médias.
- **Financeiro**: contratos de mensalidade com quitação atômica, livro caixa (entradas/saídas) e despesas operacionais.
- **Corpo Docente**: compromissos de hora/aula e pagamentos parciais vinculados.
- **Comercial / Balcão**: catálogo de produtos, controle de estoque com alertas e ponto de venda (PDV).
- **Administração**: operadores internos, contas de alunos e auditoria contábil imutável (`log_caixa`).
- **Portal do Aluno**: ambiente restrito e seguro para o aluno consultar apenas suas notas, situação cadastral e parcelas.

---

## 🏛 Arquitetura do Sistema

```
├── server.ts                  # Servidor Express Full-Stack (porta 3000)
├── src/
│   ├── server/
│   │   ├── db.ts              # Camada de Persistência Dual (MySQL nativo + engine local)
│   │   ├── api.ts             # REST API com RBAC, validação e exportação CSV segura
│   │   └── seed.ts            # Registros iniciais coerentes para demonstração
│   ├── types/
│   │   └── schema.ts          # Mapeamento estrito das 18 tabelas originais
│   ├── context/
│   │   └── AuthContext.tsx    # Gerenciamento de sessão, autenticação e perfil
│   ├── services/
│   │   └── api.ts             # Cliente HTTP frontend tipado
│   ├── views/                 # Interfaces para cada um dos módulos e tabelas
│   │   ├── DashboardView.tsx
│   │   ├── AlunosView.tsx
│   │   ├── ResponsaveisView.tsx
│   │   ├── CursosView.tsx
│   │   ├── CursosLivresView.tsx
│   │   ├── DisciplinasView.tsx
│   │   ├── TurmasView.tsx
│   │   ├── NotasView.tsx
│   │   ├── MensalidadesView.tsx
│   │   ├── CaixaView.tsx
│   │   ├── AuditoriaCaixaView.tsx
│   │   ├── DespesasView.tsx
│   │   ├── ProfessoresView.tsx
│   │   ├── PagamentosProfessoresView.tsx
│   │   ├── PagamentosParciaisView.tsx
│   │   ├── ProdutosView.tsx
│   │   ├── VendasView.tsx
│   │   ├── UsuariosView.tsx
│   │   ├── ContasAlunosView.tsx
│   │   ├── RelatoriosView.tsx
│   │   └── PortalAlunoView.tsx
│   ├── components/            # Sidebar responsiva, Header e Modal de Diagnóstico
│   ├── App.tsx                # Roteamento seguro e controle de acesso
│   └── main.tsx               # Ponto de entrada React
```

---

## 📊 Cobertura Operacional das 18 Tabelas

| Tabela | Rota no Sistema | Finalidade e Operações |
|---|---|---|
| `tb_alunos` | `/academico/alunos` | Prontuário integral com os 36 campos originais (SISTEC, livro ata, registro, página, etc.), filtros por curso/status e ficha completa do aluno. |
| `tb_responsavel_financeiro` | `/academico/responsaveis` | Cadastro de responsáveis legais com vínculo a aluno. |
| `tb_cursos` | `/academico/cursos` | Catálogo de cursos técnicos regulares com contador de turmas e disciplinas. |
| `tb_cursoLivre` | `/academico/cursos-livres` | Catálogo autônomo com carga horária e conteúdo programático detalhado. |
| `tb_materias` | `/academico/disciplinas` | Disciplinas curriculares com chave estrangeira para cursos. |
| `tb_turmas` | `/academico/turmas` | Turmas, salas, turnos (Manhã, Tarde, Noite, Sábado) e status. |
| `tb_notas` | `/academico/notas` | Lançamento de avaliações com cálculo automático de média e situação (Aprovado / Exame / Reprovado). |
| `tb_mensalidades` | `/financeiro/mensalidades` | Contratos financeiros, parcelas e baixa de mensalidade com atualização atômica de saldo e geração opcional no Caixa. |
| `tb_caixa` | `/financeiro/caixa` | Livro caixa com entradas e saídas, formas de pagamento, totalizadores de saldo líquido e filtros por período. |
| `log_caixa` | `/administracao/auditoria-caixa` | Trilha forense do caixa **estritamente somente leitura** (gravada automaticamente pelo backend). |
| `tb_despesas` | `/financeiro/despesas` | Controle de despesas operacionais por categoria com operador preenchido no servidor. |
| `tb_professores` | `/pessoas/professores` | Corpo docente com telefones de contato e demonstrativo de contratos. |
| `tb_pagamentos` | `/financeiro/pagamentos-professores` | Compromissos docentes por hora/aula, período, turma e controle de valor pendente. |
| `tb_pagamentos_parciais` | `/financeiro/pagamentos-parciais` | Baixas de pagamentos parciais vinculadas ao compromisso com validação de saldo. |
| `tb_produtos` | `/comercial/produtos` | Catálogo de itens, preço de venda, estoque com alertas para saldo baixo e proteção de visualização do custo. |
| `tb_vendas` | `/comercial/vendas` | Ponto de Venda (PDV) com baixa de estoque na transação e agrupamento de múltiplos itens sob `codigovenda`. |
| `tb_usuarios` | `/administracao/usuarios` | Gestão de operadores internos e perfis funcionais com senhas criptografadas. |
| `tb_contas` | `/administracao/contas-alunos` | Credenciais de acesso para alunos via CPF com redefinição controlada. |

---

## 🔐 Controle de Acesso Baseado em Perfis (RBAC)

O sistema conta com proteção de rotas no frontend e autorização no backend através de tokens de sessão seguros:

| Perfil | Escopo Permitido |
|---|---|
| **Administrador** | Acesso irrestrito a todos os módulos, usuários, configurações e auditoria. |
| **Secretaria** | Gestão de alunos, responsáveis, cursos, turmas, disciplinas e contas de alunos. |
| **Coordenação** | Gestão pedagógica: cursos, disciplinas, turmas e lançamento de notas. |
| **Financeiro** | Mensalidades, livro caixa, despesas, pagamentos docentes e parciais. |
| **Comercial** | Catálogo de produtos, estoque e registro de vendas/pedidos. |
| **Aluno** | Acesso exclusivo ao **Portal do Aluno** (`/portal-aluno`) para seus próprios dados. |

### Usuários de Teste Pré-Configurados:
- **Admin**: `admin` / `admin123`
- **Secretaria**: `secretaria` / `sec123`
- **Coordenação**: `coordenacao` / `coord123`
- **Financeiro**: `financeiro` / `fin123`
- **Comercial**: `comercial` / `com123`
- **Aluno (Portal)**: CPF `234.567.890-12` / `aluno123`

---

## 🛡 Regras de Negócio e Integridade

1. **Bloqueio de Exclusão Física com Histórico**: Alunos com mensalidades, notas ou movimentações no caixa não podem ser excluídos fisicamente para evitar perda de dados.
2. **Imutabilidade da Auditoria**: `log_caixa` não possui endpoints de alteração ou deleção; cada recebimento ou despesa gera um registro auditado com data, hora, operador e justificativa.
3. **Controle de Estoque e Venda Atômica**: Vendas no PDV verificam se a quantidade solicitada está disponível em estoque antes de efetivar o pedido, impedindo saldos negativos.
4. **Proteção de Exportação CSV**: Neutralização contra ataques de injeção de fórmulas CSV (prefixando caracteres `=`, `+`, `-`, `@` com apóstrofo).
5. **Senhas Seguras**: Hashes criptográficos nunca são retornados nas consultas da API ou exibidos nas tabelas.

---

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js versão 20 ou superior
- npm ou bun

### Passos:
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor em modo desenvolvimento
npm run dev

# 3. Compilar para produção
npm run build

# 4. Executar em produção
npm start
```
O sistema estará disponível em `http://localhost:3000`.

---

## 🗄 Configuração do Banco MySQL

Caso deseje conectar o Interdigitus diretamente a uma instância MySQL externa:

1. Crie o arquivo `.env` na raiz do projeto (baseado em `.env.example`):
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=seu_usuario
MYSQL_PASSWORD=sua_senha
MYSQL_DATABASE=dbinterdigitus
```
2. O backend detectará automaticamente as variáveis e executará consultas parametrizadas diretamente no MySQL.
3. Se as variáveis não forem informadas, o sistema opera no modo local isolado com as 18 tabelas ativas.

---

## 📦 Instruções para Publicação no GitHub

Para publicar este código no seu repositório pessoal ou institucional no GitHub:

1. Crie um novo repositório vazio no [GitHub](https://github.com/new) (ex: `interdigitus-gestao-escolar`).
2. No terminal do projeto, execute os comandos:

```bash
# Inicializar o repositório git (se ainda não inicializado)
git init

# Adicionar todos os arquivos
git add .

# Criar o commit inicial
git commit -m "feat: release inicial do sistema Interdigitus (dbinterdigitus)"

# Definir a branch principal como main
git branch -M main

# Vincular ao seu repositório remoto no GitHub
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# Enviar os arquivos para o GitHub
git push -u origin main
```
