# BookMind - PWA (Progressive Web App)

## 📱 O que é uma PWA?

BookMind agora é uma **Progressive Web App (PWA)**! Isso significa que você pode instalá-la no seu dispositivo (celular, tablet ou computador) e usá-la como se fosse um aplicativo nativo, com as seguintes vantagens:

- ✅ **Acesso rápido**: Ícone na tela inicial do seu dispositivo
- ✅ **Experiência completa**: Abre em tela cheia, sem a barra do navegador
- ✅ **Funciona offline**: Acesso básico mesmo sem internet (em desenvolvimento)
- ✅ **Notificações**: Receba lembretes sobre suas leituras (futuro)
- ✅ **Atualizações automáticas**: Sempre a versão mais recente

## 📲 Como Instalar

### No Android (Chrome/Edge)

1. Abra o BookMind no navegador Chrome ou Edge
2. Você verá um banner na parte inferior da tela com a opção "Instalar"
3. Clique em **"Instalar"** no banner
4. Ou toque nos **três pontos** (⋮) no canto superior direito
5. Selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**
6. Confirme a instalação
7. O ícone do BookMind aparecerá na sua tela inicial! 🎉

### No iPhone/iPad (Safari)

1. Abra o BookMind no Safari
2. Toque no botão **Compartilhar** (□↑) na parte inferior
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Personalize o nome se desejar
5. Toque em **"Adicionar"**
6. O ícone do BookMind aparecerá na sua tela inicial! 🎉

### No Desktop (Chrome/Edge)

1. Abra o BookMind no navegador Chrome ou Edge
2. Você verá um banner ou um ícone de instalação (⊕) na barra de endereços
3. Clique no ícone ou no banner
4. Clique em **"Instalar"**
5. O BookMind será instalado como um aplicativo no seu computador! 🎉

## 🔧 Recursos PWA Implementados

### ✅ Manifest (manifest.json)
- Nome e descrição do app
- Ícones em múltiplos tamanhos (192x192, 512x512)
- Cores de tema personalizadas
- Modo de exibição standalone (tela cheia)

### ✅ Service Worker (sw.js)
- Cache de recursos estáticos
- Funcionamento offline básico
- Atualizações automáticas

### ✅ Banner de Instalação
- Componente React customizado
- Aparece automaticamente quando a PWA pode ser instalada
- Pode ser dispensado pelo usuário
- Salva preferência no localStorage

### ✅ Ícone Personalizado
- Design moderno com gradiente roxo/azul
- Representa um livro com símbolo de mente/cérebro
- Otimizado para diferentes tamanhos de tela

## 🚀 Para Desenvolvedores

### Estrutura de Arquivos PWA

```
BookMind/
├── public/
│   ├── manifest.json          # Configurações da PWA
│   ├── sw.js                  # Service Worker
│   ├── icon-192x192.png       # Ícone pequeno
│   └── icon-512x512.png       # Ícone grande
├── src/
│   └── components/
│       └── InstallPWA.tsx     # Banner de instalação
└── index.html                 # Referências ao manifest e SW
```

### Testando Localmente

1. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
```

2. Para testar a PWA completa, faça o build e sirva:
```bash
npm run build
npm run preview
```

3. Abra as DevTools do Chrome:
   - Vá em **Application** > **Manifest**
   - Vá em **Application** > **Service Workers**
   - Use **Lighthouse** para auditar a PWA

### Atualizando o Service Worker

Sempre que fizer mudanças significativas, atualize a versão do cache em `public/sw.js`:

```javascript
const CACHE_NAME = 'bookmind-v2'; // Incrementar versão
```

### Adicionando Novos Recursos Offline

Adicione URLs ao array `urlsToCache` em `public/sw.js`:

```javascript
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  // Adicione mais recursos aqui
];
```

## 📊 Checklist PWA

- ✅ HTTPS (obrigatório para PWA - Supabase já fornece)
- ✅ Manifest.json configurado
- ✅ Service Worker registrado
- ✅ Ícones em múltiplos tamanhos
- ✅ Meta tags para mobile
- ✅ Tema personalizado
- ✅ Banner de instalação customizado
- ⏳ Funcionalidade offline completa (em desenvolvimento)
- ⏳ Notificações push (futuro)
- ⏳ Sincronização em background (futuro)

## 🎨 Personalizações

### Cores do Tema

As cores podem ser alteradas em `public/manifest.json`:

```json
{
  "background_color": "#0f172a",  // Cor de fundo ao abrir
  "theme_color": "#8b5cf6"        // Cor da barra de status
}
```

### Ícone do App

Para substituir o ícone, substitua os arquivos:
- `public/icon-192x192.png`
- `public/icon-512x512.png`

Mantenha as dimensões e formato PNG para melhor compatibilidade.

## 🐛 Troubleshooting

### O banner de instalação não aparece?

- Certifique-se de estar usando HTTPS
- Limpe o cache do navegador
- Verifique se já não instalou anteriormente
- Teste em modo anônimo

### Service Worker não está funcionando?

- Verifique o console do navegador
- Vá em DevTools > Application > Service Workers
- Clique em "Unregister" e recarregue a página
- Certifique-se de que o arquivo `sw.js` está acessível

### App não funciona offline?

- O cache pode levar alguns segundos para ser populado
- Verifique os recursos em DevTools > Application > Cache Storage
- Atualize a versão do cache em `sw.js`

## 📚 Recursos Adicionais

- [MDN - Progressive Web Apps](https://developer.mozilla.org/pt-BR/docs/Web/Progressive_web_apps)
- [Google - PWA Checklist](https://web.dev/pwa-checklist/)
- [Web.dev - Learn PWA](https://web.dev/learn/pwa/)

---

Desenvolvido com 💜 para leitores apaixonados
