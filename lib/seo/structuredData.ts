import { contacts } from "@/lib/data/contacts";
import { localizedPath, siteName, siteUrl } from "@/lib/seo/metadata";

/**
 * Dados estruturados (schema.org) da Home: quem é o negócio, onde fica, como
 * falar e o que oferece. O Google usa isso para entender o site como negócio
 * local e para mostrar o nome certo do site nos resultados.
 * Validar em https://search.google.com/test/rich-results depois do deploy.
 */
export function homeStructuredData({
  locale,
  description,
  catalogName,
  serviceNames,
}: {
  locale: string;
  description: string;
  catalogName: string;
  serviceNames: string[];
}) {
  const homeUrl = `${siteUrl}${localizedPath(locale, "")}`;
  const { street, neighborhood, city, state, country } = contacts.addressParts;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#site`,
        name: siteName,
        alternateName: "Sala do Banquete",
        url: `${siteUrl}/`,
        inLanguage: locale === "pt" ? "pt-BR" : "en",
      },
      {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}/#negocio`,
        name: siteName,
        alternateName: ["Sala do Banquete", "Sala do Banquete – Liliam Müller"],
        description,
        url: homeUrl,
        logo: `${siteUrl}/images/marca/logo.png`,
        image: [`${siteUrl}/images/marca/compartilhamento.jpg`, `${siteUrl}/images/galeria/1.jpeg`],
        telephone: contacts.phoneDisplay,
        email: contacts.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: `${street}, ${neighborhood}`,
          addressLocality: city,
          addressRegion: state,
          addressCountry: country,
        },
        areaServed: { "@type": "City", name: city },
        founder: { "@type": "Person", name: "Liliam Müller" },
        sameAs: [contacts.instagramUrl],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: catalogName,
          itemListElement: serviceNames.map((name) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name },
          })),
        },
      },
    ],
  };
}
