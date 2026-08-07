# 02 — Tailwind CSS

## O que é

Tailwind é uma biblioteca "utility-first": em vez de escrever uma regra CSS com nome próprio e depois aplicar essa classe (`.btn { background: #b8688a; padding: 12px 20px; }`), você compõe o visual direto no HTML/JSX combinando classes pequenas e de propósito único (`bg-banquete-rose px-5 py-3`). Cada classe faz uma coisa só.

**Vantagem prática:** não existe mais arquivo `.css` gigante que cresce para sempre e ninguém sabe mais o que pode apagar sem quebrar outra parte da página. O estilo de um componente vive junto com o componente.

**Vantagem de performance:** o Tailwind escaneia todo o código do projeto e gera **só o CSS das classes que você realmente usou**. O `style.css` antigo (596 linhas) ia inteiro para o navegador mesmo se metade das regras nunca fosse usada numa página específica; com Tailwind, o CSS final é do tamanho do que está de fato em uso.

## Tailwind v4: configuração por CSS, não por arquivo JS

Versões antigas do Tailwind (v3 e anteriores) usavam um `tailwind.config.js` separado. Na v4 (a que este projeto usa), o tema fica dentro do próprio CSS, num bloco `@theme`, em [`app/globals.css`](../app/globals.css). É lá que defini a paleta de cores e as fontes do site.

## Nossa paleta (extraída do `css/style.css` original)

```css
@theme {
  --color-banquete-bg: #faf5ef;          /* fundo geral */
  --color-banquete-dark: #3d2b35;        /* texto principal, rodapé */
  --color-banquete-rose: #b8688a;        /* cor de destaque (botões, links) */
  --color-banquete-rose-dark: #9a5472;   /* hover do destaque */
  --color-banquete-gold: #c9a84c;        /* datas de evento */
  --color-banquete-gold-light: #c4a882;  /* texto do rodapé */
  ...
}
```

Cada `--color-banquete-*` vira automaticamente uma classe utilitária: `bg-banquete-rose`, `text-banquete-dark`, `border-banquete-gold`, `hover:bg-banquete-rose-dark`, etc. Isso é uma convenção do Tailwind v4 — qualquer variável `--color-<nome>` no `@theme` gera classes `bg-<nome>`, `text-<nome>`, `border-<nome>` de graça.

Da mesma forma, `--font-serif` e `--font-sans` (mapeadas para as fontes carregadas via `next/font`, ver [`01-migracao-html-para-nextjs.md`](./01-migracao-html-para-nextjs.md)) geram as classes `font-serif` (Cormorant Garamond, para títulos) e `font-sans` (Montserrat, para texto).

## Breakpoints: por que customizamos

O CSS original usava pontos de quebra próprios — `max-width: 768px` (tablet), `680px` (troca para menu hamburger) e `400px` (celular pequeno) — enquanto o Tailwind vem, por padrão, com `sm: 640px`, `md: 768px`, `lg: 1024px`.

Para o visual em cada largura de tela ficar **idêntico** ao site atual, redefinimos dois breakpoints em `app/globals.css`:

```css
--breakpoint-xs: 400px;   /* novo — não existia por padrão */
--breakpoint-sm: 680px;   /* era 640px por padrão */
/* --breakpoint-md continua 768px — já batia com o original */
```

Diferença importante de raciocínio: o CSS antigo era "desktop-first" (o estilo base é para telas grandes, e `@media (max-width: ...)` sobrescreve para telas menores). O Tailwind é "mobile-first" (o estilo sem prefixo é a base para qualquer tela, e `sm:`/`md:` sobrescrevem **a partir** daquela largura para cima). O resultado visual final é o mesmo nos mesmos pontos de quebra — só a forma de escrever a regra se inverte. Isso vai aparecer na prática quando migrarmos os componentes visuais na Etapa 2.

## Tabela de equivalência (CSS antigo → Tailwind)

| CSS original (`style.css`) | Classe Tailwind equivalente |
|---|---|
| `background: #b8688a; color: white; padding: 12px 20px; border-radius: 6px;` (`.btn`) | `bg-banquete-rose text-white px-5 py-3 rounded-md` |
| `background: #b8688a; }:hover { background: #9a5472; }` | `bg-banquete-rose hover:bg-banquete-rose-dark` |
| `max-width: 900px; margin: 0 auto; padding: 60px 20px;` (`.container`) | `max-w-[900px] mx-auto px-5 py-15` |
| `display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;` (`.services`) | `grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5` |
| `@media (max-width: 680px) { .services { grid-template-columns: repeat(2, 1fr); } }` | `grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]` (lembrando: `sm` aqui = 680px, nosso valor customizado) |
| `font-family: "Cormorant Garamond", serif; font-size: 36px;` (`h2`) | `font-serif text-4xl` |
| `outline: 3px solid #b8688a; outline-offset: 2px;` (`:focus-visible`) | `focus-visible:outline focus-visible:outline-3 focus-visible:outline-banquete-rose focus-visible:outline-offset-2` |

Esta tabela vai crescer conforme migramos cada componente na Etapa 2 — cada card, botão e seção do site antigo vai ganhar sua linha aqui.

## Principais classes que vamos usar bastante

- **Espaçamento**: `p-4` (padding), `px-4`/`py-2` (só horizontal/vertical), `m-4`, `gap-4` (espaço entre itens de um flex/grid) — a escala é em múltiplos de `0.25rem` (então `p-4` = `1rem` = `16px`).
- **Flexbox/Grid**: `flex`, `flex-col`, `items-center`, `justify-between`, `grid`, `grid-cols-2`.
- **Responsivo**: prefixo antes da classe — `md:flex-row` só aplica a partir de 768px.
- **Estados**: `hover:`, `focus-visible:`, `active:` — prefixam qualquer classe, ex: `hover:bg-banquete-rose-dark`.
- **Dark mode / preferências do usuário**: não usado neste projeto por ora (o site não tem modo escuro), mas existe o prefixo `dark:` se um dia for necessário.
