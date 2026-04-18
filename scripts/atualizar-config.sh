#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# atualizar-config.sh — Liliam Müller / A Sala do Banquete
#
# Lê ~/.config/sala-do-banquete/.env e atualiza os valores em
# js/global.js e js/contato.js, mantendo o restante dos arquivos intacto.
#
# USO:
#   chmod +x scripts/atualizar-config.sh   (só na primeira vez)
#   ./scripts/atualizar-config.sh
#
# VARIÁVEIS ESPERADAS NO .env:
#   WHATSAPP_NUMBER=5527999999999
#   EMAIL=contato@exemplo.com.br
#   INSTAGRAM_URL=https://www.instagram.com/seuhandle/
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ENV_FILE="$HOME/.config/sala-do-banquete/.env"
GLOBAL_JS="$(cd "$(dirname "$0")/.." && pwd)/js/global.js"
CONTATO_JS="$(cd "$(dirname "$0")/.." && pwd)/js/contato.js"

# ── 1. Verificar dependências ─────────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: Arquivo de configuração não encontrado em: $ENV_FILE"
  echo "Crie o arquivo com as variáveis: WHATSAPP_NUMBER, EMAIL, INSTAGRAM_URL"
  exit 1
fi

for arquivo in "$GLOBAL_JS" "$CONTATO_JS"; do
  if [[ ! -f "$arquivo" ]]; then
    echo "ERRO: Arquivo não encontrado: $arquivo"
    exit 1
  fi
done

# ── 2. Carregar variáveis do .env ─────────────────────────────────────────────
while IFS='=' read -r chave valor; do
  [[ -z "$chave" || "$chave" == \#* ]] && continue
  chave="${chave%%[[:space:]]*}"
  valor="${valor#"${valor%%[![:space:]]*}"}"
  export "$chave=$valor"
done < "$ENV_FILE"

# ── 3. Validar campos ─────────────────────────────────────────────────────────
[[ -z "${WHATSAPP_NUMBER:-}" ]] && echo "AVISO: WHATSAPP_NUMBER não definido — WhatsApp não será atualizado."
[[ -z "${EMAIL:-}"           ]] && echo "AVISO: EMAIL não definido — e-mail não será atualizado."
[[ -z "${INSTAGRAM_URL:-}"   ]] && echo "AVISO: INSTAGRAM_URL não definido — Instagram não será atualizado."

# ── 4. Fazer backups ──────────────────────────────────────────────────────────
cp "$GLOBAL_JS"  "${GLOBAL_JS}.bak"
cp "$CONTATO_JS" "${CONTATO_JS}.bak"
echo "Backups criados (.bak)"

# ── 5. Substituir valores usando Python ───────────────────────────────────────
python3 - "$GLOBAL_JS" "$CONTATO_JS" \
         "${WHATSAPP_NUMBER:-}" \
         "${EMAIL:-}" \
         "${INSTAGRAM_URL:-}" <<'PYEOF'
import sys, re

global_js   = sys.argv[1]
contato_js  = sys.argv[2]
wa_number   = sys.argv[3]
email       = sys.argv[4]
ig_url      = sys.argv[5]

def ler(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def salvar(path, conteudo):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(conteudo)

def substituir(texto, padrao, novo_valor, descricao):
    if not novo_valor:
        return texto
    novo, n = re.subn(padrao, novo_valor, texto)
    if n == 0:
        print(f"  AVISO: padrão não encontrado para {descricao}")
    else:
        print(f"  OK: {descricao} atualizado.")
    return novo

# ── global.js: número do WhatsApp ─────────────────────────────────────────────
if wa_number:
    conteudo = ler(global_js)
    conteudo = substituir(
        conteudo,
        r'(var _n\s*=\s*")[^"]*(")',
        r'\g<1>' + wa_number + r'\2',
        'WhatsApp (global.js)'
    )
    salvar(global_js, conteudo)

# ── contato.js: e-mail ────────────────────────────────────────────────────────
if email:
    conteudo = ler(contato_js)
    conteudo = substituir(
        conteudo,
        r'(var _e\s*=\s*")[^"]*(")',
        r'\g<1>' + email + r'\2',
        'E-mail (contato.js)'
    )
    salvar(contato_js, conteudo)

# ── contato.js: Instagram ─────────────────────────────────────────────────────
if ig_url:
    conteudo = ler(contato_js)
    conteudo = substituir(
        conteudo,
        r'(var _ig\s*=\s*")[^"]*(")',
        r'\g<1>' + ig_url + r'\2',
        'Instagram (contato.js)'
    )
    salvar(contato_js, conteudo)

print("Configuração aplicada com sucesso.")
PYEOF

echo ""
echo "Verifique os arquivos JS antes de fazer o deploy."
echo "Os backups (.bak) podem ser apagados após conferência."
