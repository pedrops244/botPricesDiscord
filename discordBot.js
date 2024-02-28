import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { fetchProducts } from "./src/utils/fetchProducts.js";
import { COLORS } from "./src/config/colors.js";
import { formatProducts } from "./src/utils/formatProducts.js";
import { createEmbed } from "./src/utils/createEmbed.js";
import { sendEmbedForStore } from "./src/utils/sendEmbedForStore.js";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`${client.user.username} chegou!`);
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!preco")) {
    const query = message.content.slice("!preco".length).trim();
    if (query.length < 15) {
      return message.channel.send(
        "Oops! Seu pedido precisa de mais detalhes, como modelo, marca, cor, etc. 🙈"
      );
    }
    try {
      message.channel.send(
        `${client.user.username} está farejando os preços, aguarde! 🙉`
      );

      const kabumProducts = await fetchProducts(
        "https://www.kabum.com.br/busca/",
        query,
        "div.productCard",
        "a.productLink",
        "span.priceCard",
        "span.nameCard"
      );
      const mercadoLivreProducts = await fetchProducts(
        "https://lista.mercadolivre.com.br/",
        query,
        "div.andes-card",
        "a.ui-search-link__title-card",
        ".andes-money-amount__fraction",
        "h2.ui-search-item__title"
      );

      const amazonProducts = await fetchProducts(
        "https://www.amazon.com.br/s?k=",
        query,
        "div.puis-card-container.s-card-container",
        "a.a-link-normal.a-text-normal",
        "span.a-price-whole",
        "span.a-size-base-plus.a-color-base.a-text-normal"
      );

      await sendEmbedForStore(
        message,
        "Kabum",
        kabumProducts,
        query,
        COLORS.KABUM,
        "https://www.kabum.com.br/busca/"
      );
      await sendEmbedForStore(
        message,
        "Mercado Livre",
        mercadoLivreProducts,
        query,
        COLORS.MERCADO_LIVRE,
        "https://lista.mercadolivre.com.br/"
      );
      await sendEmbedForStore(
        message,
        "Amazon",
        amazonProducts,
        query,
        COLORS.AMAZON,
        "https://www.amazon.com.br/s?k="
      );
    } catch (error) {
      console.error(error);
      message.channel.send(
        "Desculpe, não foi possível pesquisar o preço no momento. Por favor, tente novamente mais tarde."
      );
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
