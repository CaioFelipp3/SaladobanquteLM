# ⚡ Guia Rápido - Sala do Banquete

## 🎯 Visão Geral

Sistema **pronto para produção** de vendas de ingressos com:
- ✅ Frontend moderno e responsivo
- ✅ Backend com Mercado Pago integrado
- ✅ Segurança em nível enterprise
- ✅ Documentação completa

---

## 🚀 Iniciar em 5 Minutos

### Terminal 1 - Frontend
```bash
cd frontend
python3 -m http.server 8000
```
Abra: http://localhost:8000/src/pages/index.html

### Terminal 2 - Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env com credenciais Mercado Pago
npm start
```

---

## 📁 Estrutura

```
frontend/src/
├── pages/              HTML (3 páginas)
├── styles/             CSS (3 arquivos)
├── scripts/            JS (7 módulos)
└── assets/             Imagens (10 arquivos)

backend/
├── src/server.js       API Express
├── package.json
└── .env.example
```

---

## 🔧 Tarefas Comuns

### Alterar Textos
```bash
frontend/src/scripts/inter.js
# Edite as strings com chave data-i18n
```

### Adicionar Imagem
```bash
# 1. Copie para: frontend/src/assets/
# 2. Use no HTML: <img src="../assets/imagem.jpg">
```

### Novo Evento
```bash
# 1. Edite: frontend/src/scripts/inter.js
# 2. Adicione evento2, evento3, etc
# 3. Copie o card HTML em ingressos.html
```

### Mudar Cores
```bash
# frontend/src/styles/global.css
:root {
  --rosa: #b8688a;  /* Mude aqui */
}
```

---

## 🔐 Configurar Mercado Pago

### 1. Pegar Credenciais
- Acesse: https://www.mercadopago.com.br
- Vá em: Configurações → Credenciais
- Copie: **Access Token** + **Public Key**

### 2. Configurar Webhook
- Vá em: Configurações → Webhooks
- URL: `https://seu-dominio.com/api/webhook`
- Eventos: `payment.created`, `payment.updated`
- Copie o **Secret**

### 3. Preencher .env
```bash
backend/.env

MERCADO_PAGO_ACCESS_TOKEN=...
MERCADO_PAGO_PUBLIC_KEY=...
WEBHOOK_SECRET=...
ADMIN_TOKEN=seu_token_aleatorio
FRONTEND_URL=http://localhost:8000
BACKEND_URL=http://localhost:3000
```

---

## ✅ Checklist Pré-Deploy

- [ ] Frontend funciona localmente
- [ ] Backend funciona localmente
- [ ] Pagamento de teste funciona (sandbox MP)
- [ ] Email funciona (se implementado)
- [ ] HTTPS configurado
- [ ] .env com credenciais reais
- [ ] Domínio configurado em Mercado Pago
- [ ] Webhook testado
- [ ] Rate limiting ativado
- [ ] Logs sendo armazenados

---

## 🌐 Deploy

### Frontend (Vercel - Recomendado)
```bash
# 1. Conectar repo no Vercel
# 2. Build: npm run build (ou deixar padrão)
# 3. Publish directory: frontend/
# 4. Pronto!
```

### Backend (Heroku)
```bash
# 1. Criar app: heroku create
# 2. Adicionar Procfile: web: npm start
# 3. Configurar .env no Heroku
# 4. git push heroku main
```

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| CORS error | Verificar FRONTEND_URL em backend/.env |
| Mercado Pago não funciona | Usar ngrok para testar localmente |
| Webpack não existe | Projeto não usa bundler (vanilla JS) |
| Port 3000 ocupada | `lsof -i :3000` e `kill -9 <PID>` |

---

## 📚 Documentação

- **README.md** - Visão geral
- **docs/guides/SETUP.md** - Instruções detalhadas
- **docs/reference/ARQUITETURA.md** - Decisões técnicas
- **Comentários no código** - Explicações técnicas

---

## 💡 Dicas

1. **Testar Pagamento**
   - Cartão: 4111 1111 1111 1111
   - Validade: 11/25
   - CVV: 123

2. **Ver Logs**
   ```bash
   # Backend
   tail -f backend/transacoes.json
   
   # Frontend (console do navegador)
   F12 → Console
   ```

3. **Limpar Cache**
   - Ctrl+Shift+Del (Chrome)
   - Cmd+Shift+Del (Mac)

4. **Testar HTTPS Localmente**
   ```bash
   # Instalar mkcert
   mkcert localhost
   # Usar certificados em dev
   ```

---

## 🤝 Suporte

Dúvidas? Consulte:
1. Documentação em `/docs`
2. Comentários no código
3. GitHub Issues (se houver)

---

**Última atualização:** 17 de Abril de 2026
**Status:** ✅ Production Ready
**Versão:** 1.0.0

