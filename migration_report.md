# Migração de Navegação para React Router

A navegação da aplicação foi migrada com sucesso de um estado interno (`activeView`) para rotas baseadas em URL utilizando `react-router-dom`. Isso habilita deep-linking, histórico do navegador e uma experiência mais robusta.

## Arquivos Alterados
- `package.json`: Adicionada dependência `react-router-dom`.
- `src/main.tsx`: Adicionado `BrowserRouter` para envolver a aplicação.
- `src/App.tsx`: Substituída a lógica de estado `activeView` por `Routes` e `Route`.
- `src/components/Layout.tsx`: Atualizada a lógica do menu lateral para usar `location.pathname` e `navigate`.

## Mapeamento de Rotas

| Rota | Tela Mapeada |
| :--- | :--- |
| `/dashboard` | Dashboard |
| `/library` | Biblioteca |
| `/genres` | Gêneros |
| `/goals` | Metas |
| `/lists` | Listas |
| `/calendar` | Calendário |
| `/settings` | Configurações |
| `/` | Redireciona para `/dashboard` |
| `*` (fallback) | Redireciona para `/dashboard` |

## Fases da Implementação

### Fase 1: Mapear views para rotas
- Instalação e configuração inicial do `react-router-dom`.
- Definição da estrutura de rotas em `App.tsx`.
- Implementação de redirecionamento automático para a rota padrão (`/dashboard`).
- Garantia de que cada tela renderiza corretamente ao acessar a URL diretamente.

### Fase 2: Ajustar navegação e menu ativo
- Remoção das props `activeView` e `onViewChange` do componente `Layout`.
- Uso do hook `useLocation` para identificar a rota atual de forma reativa.
- Atualização visual dos itens de menu (estado ativo) baseada na URL.
- Substituição da troca de estado manual pelo hook `useNavigate` ao clicar nos itens do menu.
- Validação do funcionamento dos botões "Voltar" e "Avançar" do navegador.

## Extra: `/books/:id`
A rota `/books/:id` não foi implementada nesta sprint para evitar o aumento de risco e a necessidade de refatorar o `BookDetailModal` (que atualmente funciona como um modal de diálogo sobreposto). A experiência atual de clicar em um livro para abrir o modal foi preservada integralmente conforme solicitado, mantendo o foco na estabilidade das rotas base.
