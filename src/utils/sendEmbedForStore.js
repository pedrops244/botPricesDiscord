import { createEmbed } from "./createEmbed.js";
import { formatProducts } from "./formatProducts.js";
import { COLORS } from "../config/colors.js";

export async function sendEmbedForStore(
  message,
  storeName,
  products,
  query,
  color,
  baseUrl
) {
  try {
    let embed;
    if (products.length === 1 && products[0].price === "Preço não encontrado") {
      embed = createEmbed({
        color: COLORS.WARNING,
        title: `Nenhum resultado encontrado em ${storeName}`,
        description: `Sua busca por "${query}" não encontrou nenhum produto em ${storeName}. Tente modificar sua pesquisa ou [clique aqui para tentar novamente](${baseUrl}${encodeURIComponent(
          query
        )}).`,
        footerText: "Tente usar termos diferentes ou mais específicos.",
      });
    } else {
      const description =
        formatProducts(products, "R$ ") +
        `\n[Ver mais resultados](${baseUrl}${encodeURIComponent(query)})`;
      embed = createEmbed({
        color: color,
        title: `${storeName} para: ${query}`,
        description,
        footerText: "Preços sujeitos a alteração.",
      });

      // Calcula o tamanho do embed para verificar se está dentro do limite
      const embedSize = new TextEncoder().encode(JSON.stringify(embed)).length;
      if (embedSize > 4096) {
        // Se o tamanho do embed exceder o limite, ajusta a descrição
        embed = createEmbed({
          color: COLORS.SUCCESS,
          title: "Limite de caracteres excedido",
          description: `Os resultados da pesquisa para "${query}" em ${storeName} não podem ser exibidos aqui devido ao limite de tamanho. Por favor, [clique aqui para ver todos os produtos](${baseUrl}${encodeURIComponent(
            query
          )}).`,
          footerText:
            "A pesquisa retornou muitos resultados para serem exibidos aqui.",
        });
      }
    }

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(`Erro ao enviar embeds para a loja: ${storeName}`, error);
  }
}
