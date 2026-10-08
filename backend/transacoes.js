// ─── Persistência de transações em arquivo JSON ──────────────
// Módulo separado do server.js para poder ser testado isoladamente
// (corrupção de arquivo, escrita concorrente, permissões).
//
// Limitação conhecida: o lock é em memória — vale para UM processo. Com
// mais de uma instância do servidor escrevendo no mesmo arquivo, é
// preciso trocar por um banco de dados (ver docs/08-auditoria-seguranca.md).

const fsPromises = require("fs").promises;
const path = require("path");

// O arquivo contém PII (nome, e-mail): só o dono do processo lê/escreve.
const FILE_MODE = 0o600;
const MAX_TRANSACOES = 100000;

function isTransacaoValida(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    !Array.isArray(item) &&
    (typeof item.transactionId === "string" || typeof item.transactionId === "number")
  );
}

function criarRepositorio(filePath) {
  const dir = path.dirname(filePath);
  let writeLock = Promise.resolve();

  // Move um arquivo inválido para o lado em vez de descartá-lo: preserva os
  // dados para recuperação manual e evita que a próxima escrita sobrescreva
  // todo o histórico com uma lista vazia.
  async function quarentena(motivo) {
    const destino = filePath.replace(/\.json$/, `.corrompido-${Date.now()}.json`);
    try {
      await fsPromises.rename(filePath, destino);
    } catch (err) {
      // Uma leitura concorrente (GET /transacoes) já moveu o arquivo
      if (err.code === "ENOENT") return;
      throw err;
    }
    console.error(`❌ ${path.basename(filePath)} inválido (${motivo}) — movido para ${path.basename(destino)}`);
  }

  async function load() {
    let data;
    try {
      data = await fsPromises.readFile(filePath, "utf-8");
    } catch (err) {
      // ENOENT = arquivo ainda não existe — esperado na primeira execução
      if (err.code === "ENOENT") return [];
      throw err;
    }

    if (data.trim() === "") return [];

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      await quarentena("JSON malformado");
      return [];
    }

    // JSON válido não basta: `{}` ou `null` fariam .some()/.push() lançarem
    // erro e toda transação nova seria perdida em silêncio.
    if (!Array.isArray(parsed) || !parsed.every(isTransacaoValida)) {
      await quarentena("estrutura inesperada");
      return [];
    }

    return parsed;
  }

  // Escrita atômica: grava num arquivo temporário e renomeia. rename() no
  // mesmo diretório é atômico — se o processo cair no meio, o arquivo
  // original continua intacto em vez de ficar pela metade.
  async function writeAtomic(conteudo, destino = filePath) {
    const tmp = path.join(dir, `.${path.basename(destino)}.${process.pid}.${Date.now()}.tmp`);
    await fsPromises.writeFile(tmp, JSON.stringify(conteudo, null, 2), { mode: FILE_MODE });
    await fsPromises.rename(tmp, destino);
  }

  /**
   * Salva a transação se ainda não existir.
   * @returns {Promise<boolean>} true se foi gravada agora; false se já
   *   existia (webhook duplicado) ou se a escrita falhou.
   */
  function salvar(transacao) {
    const operacao = writeLock.then(async () => {
      let transacoes = await load();

      // Idempotência: o Mercado Pago entrega "at least once" — o mesmo
      // evento pode chegar mais de uma vez.
      if (transacoes.some((t) => String(t.transactionId) === String(transacao.transactionId))) {
        return false;
      }

      // Teto contra crescimento ilimitado: rotaciona para um arquivo datado.
      if (transacoes.length >= MAX_TRANSACOES) {
        const backup = filePath.replace(/\.json$/, `.${new Date().toISOString().split("T")[0]}.bak`);
        await writeAtomic(transacoes, backup);
        console.warn(`⚠️ ${path.basename(filePath)} rotacionado para ${path.basename(backup)}`);
        transacoes = [];
      }

      transacoes.push({ ...transacao, data: new Date().toISOString() });
      await writeAtomic(transacoes);
      return true;
    });

    // O lock segue mesmo se esta operação falhar — senão um erro de disco
    // travaria todas as escritas seguintes.
    writeLock = operacao.catch(() => {});

    return operacao.catch((err) => {
      console.error("❌ Erro ao salvar transação:", err.message);
      return false;
    });
  }

  return { load, salvar };
}

module.exports = { criarRepositorio };
