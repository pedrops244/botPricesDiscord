import { Client, GatewayIntentBits } from "discord.js";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import dotenv from "dotenv";
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
        `${client.user.username} está procurando os melhores preços para você...`
      );

      const amazonProducts = await fetchProducts(
        "https://www.amazon.com.br/s?k=",
        query,
        "div.puis-card-container.s-card-container",
        "a.a-link-normal.a-text-normal",
        "span.a-price-whole",
        "span.a-size-base-plus.a-color-base.a-text-normal"
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

      await sendEmbedForStore(
        message,
        "Amazon",
        amazonProducts,
        query,
        parseInt("FFC107", 16),
        "https://www.amazon.com.br/s?k="
      );
      await sendEmbedForStore(
        message,
        "Kabum",
        kabumProducts,
        query,
        parseInt("FF9900", 16),
        "https://www.kabum.com.br/busca/"
      );
      await sendEmbedForStore(
        message,
        "Mercado Livre",
        mercadoLivreProducts,
        query,
        parseInt("FFFF00", 16),
        "https://lista.mercadolivre.com.br/"
      );
    } catch (error) {
      console.error(error); // Log do erro para depuração
      message.channel.send(
        "Desculpe, não foi possível pesquisar o preço no momento. Por favor, tente novamente mais tarde."
      );
    }
  }
});

async function fetchProducts(
  url,
  query,
  cardSelector,
  linkSelector,
  priceSelector,
  titleSelector
) {
  let options = new chrome.Options();
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-gpu");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--enable-chrome-browser-cloud-management");
  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get(url + encodeURIComponent(query));
    await driver.wait(until.elementLocated(By.css(linkSelector)), 10000);

    let products = [];
    // Encontre os elementos que contêm todos os dados necessários de cada produto. Isso pode precisar de ajuste.
    const productElements = await driver.findElements(By.css(cardSelector));
    for (let productElement of productElements.slice(0, 5)) {
      // Limita a 5 produtos para manter a saída gerenciável
      let product = {};

      const linkElement = await productElement
        .findElement(By.css(linkSelector))
        .catch(() => null);
      const priceElement = await productElement
        .findElement(By.css(priceSelector))
        .catch(() => null);
      const titleElement = await productElement
        .findElement(By.css(titleSelector))
        .catch(() => null);

      product.link = linkElement
        ? await linkElement.getAttribute("href")
        : "Link não encontrado";
      product.price = priceElement
        ? await priceElement.getText()
        : "Preço não encontrado";
      product.title = titleElement
        ? await titleElement.getText()
        : "Título não encontrado";

      // Adiciona o produto apenas se pelo menos um dos dados (link, preço ou título) foi encontrado.
      if (linkElement || priceElement || titleElement) {
        products.push(product);
      }
    }

    return products.length > 0
      ? products
      : [
          {
            link: "Link do produto não encontrado",
            price: "Preço não encontrado",
            title: "Descrição não encontrada",
          },
        ];
  } finally {
    await driver.quit();
  }
}

async function sendEmbedForStore(
  message,
  storeName,
  products,
  query,
  color,
  baseUrl
) {
  try {
    let currency = "R$ "; // Ajuste conforme necessário para outras lojas
    let description =
      formatProducts(products, currency) +
      `\n[Ver mais resultados](${baseUrl}${encodeURIComponent(query)})`;

    // Verifica o tamanho do embed
    const embedSize = JSON.stringify({
      title: `${storeName} para: ${query}`,
      description: description,
    }).length;

    // Limites do Discord
    const maxEmbedSize = 4096; // O tamanho máximo de caracteres para um embed

    if (embedSize > maxEmbedSize) {
      // Se o tamanho do embed exceder o limite, envie um embed simplificado
      await message.channel.send({
        embeds: [
          {
            color: 0xff0000,
            title: `${storeName} para: ${query}`,
            description: `Os resultados da pesquisa para "${query}" em ${storeName} excederam o limite máximo de caracteres. Por favor, acesse o link diretamente para ver todos os produtos: [Ver resultados](${baseUrl}${encodeURIComponent(
              query
            )})`,
            timestamp: new Date().toISOString(),
            footer: {
              text: "A pesquisa retornou muitos resultados para serem exibidos aqui.",
            },
          },
        ],
      });
    } else {
      // Se o tamanho do embed estiver dentro do limite, envie o embed normalmente
      const embed = {
        color: color,
        title: `${storeName} para: ${query}`,
        description: description,
        timestamp: new Date().toISOString(),
        footer: {
          text: "Preços sujeitos a alteração.",
        },
      };

      await message.channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error("Erro ao enviar embeds para a loja:", storeName, error);
  }
}

function formatProducts(products, currency) {
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

client.login(process.env.DISCORD_TOKEN);
