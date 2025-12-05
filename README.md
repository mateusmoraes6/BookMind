# 📚 BookMind

**Gerenciador Inteligente de Leituras**

BookMind é uma aplicação web moderna e intuitiva para gerenciar sua biblioteca pessoal, acompanhar seu progresso de leitura, definir metas e organizar seus livros por gêneros e categorias personalizadas.

![BookMind](https://img.shields.io/badge/BookMind-v1.0.0-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6)
![Supabase](https://img.shields.io/badge/Supabase-2.57.4-3ECF8E)

## ✨ Funcionalidades

### 📖 Gerenciamento de Livros
- Adicionar, editar e excluir livros da sua biblioteca
- Acompanhar progresso de leitura (página atual, status)
- Avaliar livros com sistema de estrelas (1-5)
- Adicionar capas, descrições, ISBN e ano de publicação
- Status de leitura: Não iniciado, Em progresso, Concluído

### 🏷️ Organização por Gêneros e Subcategorias
- Gêneros padrão pré-configurados (Fantasia, Ficção Científica, Romance, etc.)
- Criar gêneros personalizados com cores e ícones
- Organizar livros em subcategorias dentro de cada gênero
- Sistema visual com tags coloridas

### 📊 Dashboard e Estatísticas
- Visão geral da sua biblioteca
- Estatísticas de leitura (total de livros, páginas lidas, etc.)
- Gráficos e métricas de progresso

### 🎯 Metas de Leitura
- Definir metas diárias, mensais ou anuais
- Acompanhar progresso em tempo real
- Metas personalizáveis por páginas ou quantidade de livros

### 📅 Calendário de Leitura
- Visualizar sessões de leitura em calendário
- Registrar sessões com páginas lidas e duração
- Histórico completo de leituras

### 📝 Listas Personalizadas
- Criar listas customizadas de livros
- Organizar por temas, projetos ou qualquer critério
- Adicionar descrições e personalizar cores

### ⚙️ Configurações
- Tema claro/escuro (dark mode como padrão)
- Preferências de interface
- Configurações de notificações
- Personalização de livros por página

## 🛠️ Tecnologias Utilizadas

- **Frontend:**
  - React 18.3.1
  - TypeScript 5.5.3
  - Vite 5.4.2
  - Tailwind CSS 3.4.1
  - Lucide React (ícones)

- **Backend & Database:**
  - Supabase (PostgreSQL)
  - Autenticação Supabase
  - Row Level Security (RLS)

- **Ferramentas:**
  - ESLint
  - PostCSS
  - Autoprefixer

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- Conta no [Supabase](https://supabase.com/) (gratuita)

## 🚀 Instalação

### 1. Clone o repositório

git clone https://github.com/seu-usuario/BookMind.git
cd BookMind
### 2. Instale as dependências

npm install

### 3. Configure o Supabase

#### 3.1. Criar projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Faça login ou crie uma conta gratuita
3. Clique em **"New Project"**
4. Preencha:
   - **Nome do projeto:** `BookMind` (ou outro de sua preferência)
   - **Database Password:** (anote esta senha)
   - **Region:** Escolha a região mais próxima
5. Aguarde a criação do projeto (2-3 minutos)

#### 3.2. Executar a migration do banco de dados

1. No dashboard do Supabase, vá em **SQL Editor**
2. Abra o arquivo `supabase/migrations/20251121233027_create_bookmind_schema.sql`
3. Copie todo o conteúdo do arquivo
4. Cole no SQL Editor do Supabase
5. Clique em **Run** para executar a migration

Isso criará todas as tabelas necessárias:
- `profiles` - Perfis de usuários
- `genres` - Gêneros de livros
- `subcategories` - Subcategorias
- `books` - Livros
- `reading_sessions` - Sessões de leitura
- `reading_goals` - Metas de leitura
- `custom_lists` - Listas personalizadas
- `book_notes` - Anotações
- `book_reviews` - Avaliações
- `user_preferences` - Preferências do usuário
- E outras tabelas relacionadas

#### 3.3. Obter as credenciais do Supabase

1. No dashboard do Supabase, vá em **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public key** (chave pública anônima)

#### 3.4. Configurar variáveis de ambiente

1. Na raiz do projeto, crie um arquivo `.env`:

VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica-aqui**⚠️ Importante:** Substitua pelos valores reais do seu projeto Supabase.

#### 3.5. (Opcional) Desabilitar confirmação de email

Para desenvolvimento local, você pode desabilitar a confirmação de email:

1. No Supabase Dashboard, vá em **Authentication** > **Settings**
2. Em **Email Auth**, desmarque **"Enable email confirmations"**
3. Salve as alterações

## 🎮 Como Executar

### Modo de Desenvolvimento

npm run dev -> A aplicação estará disponível em `http://localhost:5173`

### Build para Produção

npm run build -> Os arquivos otimizados estarão na pasta `dist/`

---

O projeto utiliza **Row Level Security (RLS)** do Supabase, garantindo que:
- Cada usuário só acessa seus próprios dados
- Todas as operações requerem autenticação
- As políticas de segurança são aplicadas automaticamente

## 🎨 Personalização

### Gêneros Padrão

Os gêneros padrão são criados automaticamente quando um novo usuário faz login pela primeira vez. Para modificar, edite o array `defaultGenres` em `src/contexts/AuthContext.tsx`:

const defaultGenres = [
  { name: 'Fantasia', color: '#8b5cf6', icon: 'wand-2' },
  { name: 'Ficção Científica', color: '#3b82f6', icon: 'rocket' },
  // Adicione mais gêneros aqui
];

### Tema

O tema dark é o padrão. Os usuários podem alternar entre claro e escuro nas configurações.

## 🐛 Solução de Problemas

### Erro: "Missing Supabase environment variables"

Certifique-se de que o arquivo `.env` existe na raiz do projeto e contém as variáveis corretas.

### Erro: "429 Too Many Requests"

Aguarde alguns minutos antes de tentar novamente. Isso ocorre quando há muitas requisições ao Supabase.

### Gêneros duplicados

Se você encontrar gêneros duplicados, execute esta query no SQL Editor do Supabase:

WITH duplicados AS (
  SELECT 
    id,
    user_id,
    name,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, name 
      ORDER BY created_at ASC, id ASC
    ) as row_num
  FROM genres
)
DELETE FROM genres
WHERE id IN (
  SELECT id 
  FROM duplicados 
  WHERE row_num > 1
);

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um Fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

## 👨‍💻 Autor

Desenvolvido com ❤️ para amantes de livros

- [Supabase](https://supabase.com/) - Backend e autenticação
- [React](https://react.dev/) - Framework frontend
- [Tailwind CSS](https://tailwindcss.com/) - Estilização
- [Lucide Icons](https://lucide.dev/) - Ícones

---

**Desfrute organizando suas leituras com BookMind! 📚**

