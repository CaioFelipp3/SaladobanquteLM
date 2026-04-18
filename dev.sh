#!/bin/bash

# 🚀 Script de Desenvolvimento - Sala do Banquete

set -e

echo "🎭 Sala do Banquete - Dev Server"
echo "=================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale em https://nodejs.org${NC}"
    exit 1
fi

# Verificar Python para servidor frontend
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 não encontrado. Instale Python.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pré-requisitos OK${NC}"
echo ""

# Iniciar Frontend
echo -e "${YELLOW}▶️  Iniciando Frontend em http://localhost:8000${NC}"
cd frontend
python3 -m http.server 8000 > /dev/null 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend PID: $FRONTEND_PID${NC}"

# Iniciar Backend
echo -e "${YELLOW}▶️  Iniciando Backend em http://localhost:3000${NC}"
cd ../backend

# Verificar se .env existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Criado .env (edite com suas credenciais)${NC}"
fi

npm start > /dev/null 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend PID: $BACKEND_PID${NC}"

echo ""
echo -e "${GREEN}✅ Servidores iniciados!${NC}"
echo ""
echo "📍 Frontend: http://localhost:8000/src/pages/index.html"
echo "📍 Backend:  http://localhost:3000"
echo ""
echo -e "${YELLOW}Pressione CTRL+C para parar${NC}"

# Trap para limpar ao sair
trap "kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; echo ''; echo '🛑 Servidores parados'; exit 0" INT TERM

# Manter em execução
while true; do
  sleep 1
done
