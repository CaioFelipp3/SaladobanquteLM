// Instala os hooks do Husky (roda no `npm install` pelo script "prepare").
// Em CI e no build da Vercel não há commits — e o husky (devDependency) pode
// nem estar instalado —, então pula em vez de quebrar o deploy.
// Padrão da documentação do Husky: https://typicode.github.io/husky/how-to.html
if (process.env.CI || process.env.VERCEL || process.env.NODE_ENV === "production") {
  process.exit(0);
}

try {
  const husky = (await import("husky")).default;
  const message = husky();
  if (message) console.log(message);
} catch {
  console.warn("husky não instalado — hooks de pre-commit não foram ativados.");
}
