# 11 — SEO (aparecer no Google)

O que já está no código e o que precisa ser feito fora dele para a Sala do Banquete aparecer quando alguém procura "mesa posta Vitória", "espaço para eventos Vitória ES" ou o próprio nome.

> **Nada disso vale enquanto o domínio servir o site antigo.** Em novembro de 2026, `www.saladobanquetelm.com.br` ainda entrega a versão em HTML puro, sem `robots.txt`, sem `sitemap.xml` e sem as páginas novas. O primeiro passo é publicar esta versão.

## O que já está no site

| Item | Onde | Para quê |
|---|---|---|
| Título e descrição de cada página, em PT e EN, com cidade e serviços | `lib/i18n/messages/*.json` (chaves `Metadata`) | É o texto azul e o resumo que aparecem no resultado do Google |
| `canonical` e `hreflang` (pt, en, x-default) | `lib/seo/metadata.ts` | O Google entende `/servicos` e `/en/servicos` como a mesma página em idiomas diferentes, e não como conteúdo duplicado |
| `sitemap.xml` e `robots.txt` | `app/sitemap.ts`, `app/robots.ts` | Lista das páginas para o Google rastrear. Seções desligadas em `lib/features.ts` ficam de fora |
| Dados estruturados (JSON-LD): `LocalBusiness` + `WebSite` | `lib/seo/structuredData.ts`, renderizado na Home | Diz ao Google que é um negócio local em Vitória, com endereço, telefone, Instagram, fundadora e serviços |
| Imagem de compartilhamento 1200×630 | `public/images/marca/compartilhamento.jpg` | Preview do link no Google, WhatsApp, Instagram e Facebook |
| Texto alternativo nas fotos da galeria | `Home.Gallery.imageAlt` | As fotos aparecem na busca de imagens ("mesa posta Vitória") |
| Site rápido, estático, com HTTPS e bom no celular | — | Velocidade e versão mobile contam no ranking |

## O que fazer fora do código (em ordem de impacto)

### 1. Publicar o site novo
Deploy na Vercel com o domínio `www.saladobanquetelm.com.br`. Conferir depois que `https://www.saladobanquetelm.com.br/sitemap.xml` abre.

### 2. Perfil da Empresa no Google (Google Business Profile) — o mais importante
Para busca local ("perto de mim", "em Vitória") e para aparecer no Google Maps, o perfil pesa mais que o site.

- Criar ou reivindicar em <https://business.google.com>, com o **mesmo nome, endereço e telefone** do site (`lib/data/contacts.ts`). Divergências confundem o Google.
- Categoria principal: algo como "Espaço para eventos" ou "Serviço de decoração de eventos". Acrescentar categorias secundárias que existam no Google (ex.: "Organizador de eventos").
- Colar o link do site e do WhatsApp; preencher horário e descrição; subir fotos das mesas postas (as mesmas da galeria servem).
- **Pedir avaliações** a clientes satisfeitos, e responder a todas. Quantidade e frequência de avaliações estão entre os fatores mais fortes da busca local.
- Publicar novidades no perfil quando houver (aulas, e-books).

### 3. Google Search Console
<https://search.google.com/search-console>

1. Adicionar a propriedade do tipo **Domínio** (`saladobanquetelm.com.br`) e verificar pelo registro TXT no DNS, no painel onde o domínio foi comprado. Esse método cobre www, sem-www e http/https de uma vez e não exige mudar o código.
2. Em *Sitemaps*, enviar `https://www.saladobanquetelm.com.br/sitemap.xml`.
3. Em *Inspeção de URL*, inspecionar a Home e clicar em *Solicitar indexação*.
4. Voltar em 1–2 semanas: *Páginas* mostra o que foi indexado, e *Desempenho* mostra por quais buscas o site aparece.

### 4. Validar os dados estruturados
Depois do deploy, testar a Home em <https://search.google.com/test/rich-results>. Deve reconhecer `LocalBusiness` sem erros.

### 5. Consistência e links
- Bio do Instagram com o link do site.
- Mesmo nome/endereço/telefone em todo lugar onde a Sala do Banquete aparece (Instagram, Facebook, guias de casamento e festas, fornecedores parceiros).
- Links de sites locais (fornecedores, buffets, fotógrafos, blogs de festas em Vitória) apontando para o site ajudam a ganhar relevância.

## Pendências de conteúdo que melhoram o ranking

- [ ] **Descrição de cada serviço.** Hoje os cards de `/servicos` têm só o nome. Um ou dois parágrafos por serviço, citando "Vitória" naturalmente, dariam ao Google texto para associar a buscas como "mesa posta para casamento em Vitória".
- [ ] **CEP** do endereço, para completar o `PostalAddress` em `lib/data/contacts.ts` (`addressParts`).
- [ ] Horário de atendimento, se houver, para o JSON-LD (`openingHoursSpecification`) e o Perfil da Empresa.
- [ ] Ao ligar Aulas ou E-books (`lib/features.ts`), as páginas entram sozinhas no sitemap e no menu. Pedir indexação delas no Search Console.
