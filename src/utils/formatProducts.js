export function formatProducts(products, currency) {
  return products
    .map((product, index) => {
      // Verifica se o link do produto contém identificador único para Amazon ou Mercado Livre
      const isAmazonOrMercadoLivre =
        product.link.includes("amazon.com") ||
        product.link.includes("mercadolivre.com");

      // Aplica o prefixo de moeda se o link for identificado como Amazon ou Mercado Livre, caso contrário, não aplica
      const priceString = isAmazonOrMercadoLivre
        ? `${currency}${product.price}`
        : product.price;

      return `${index + 1}: ${priceString} - [${product.title}](${
        product.link
      })`;
    })
    .join("\n");
}
