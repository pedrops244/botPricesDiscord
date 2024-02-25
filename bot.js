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
  console.log(`${client.user.displayName} chegou PORRA! 🙊`);
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!preco")) {
    const query = message.content.slice("!preco".length).trim();
    if (query.length < 30) {
      return message.channel.send(
        "Oops! Seu pedido precisa de mais detalhes, como modelo, marca, cor, etc. 🙈"
      );
    }

    message.channel.send(
      `${client.user.username} está farejando os preços, aguarde! 🙉`
    );

    const prices = await fetchPrices(query);

    const color = parseInt("0099ff", 16);

    const embed = {
      color: color,
      title: `Resultados da pesquisa para: ${query}`,
      description: "Aqui estão os preços encontrados:",
      fields: [
        {
          name: "Amazon",
          value: `${formatPrices(
            prices.amazon,
            "R$ "
          )}\n[Ver mais resultados](https://www.amazon.com.br/s?k=${encodeURIComponent(
            query
          )})`,
          inline: true,
        },
        {
          name: "Kabum",
          value: `${formatPrices(
            prices.kabum,
            ""
          )}\n[Ver mais resultados](https://www.kabum.com.br/busca?query=${encodeURIComponent(
            query.replace(/ /g, "-")
          )})`,
          inline: true,
        },
        {
          name: "Mercado Livre",
          value: `${formatPrices(
            prices.mercadoLivre,
            "R$ "
          )}\n[Ver mais resultados](https://lista.mercadolivre.com.br/${encodeURIComponent(
            query.replace(/ /g, "-")
          )})`,
          inline: true,
        },
        {
          name: "AliExpress",
          value: `${formatPrices(
            prices.aliexpress,
            ""
          )}\n[Ver mais resultados](https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(
            query
          )})`,
          inline: true,
        },
      ],
      timestamp: new Date(),
      footer: {
        text: "Preços sujeitos a alteração.",
      },
    };

    message.channel.send({ embeds: [embed] });
  }
});

async function fetchPrices(query) {
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
    const amazonPrice = await fetchPrice(
      driver,
      "https://www.amazon.com.br/s?k=",
      query,
      "span.a-price-whole"
    );
    const kabumPrice = await fetchPrice(
      driver,
      "https://www.kabum.com.br/busca/",
      query.replace(/ /g, "-"),
      ".priceCard"
    );
    const mercadoLivrePrice = await fetchPrice(
      driver,
      "https://lista.mercadolivre.com.br/",
      query.replace(/ /g, "-"),
      ".andes-money-amount__fraction"
    );
    const aliexpressPrice = await fetchPrice(
      driver,
      "https://www.aliexpress.com/wholesale?SearchText=",
      query,
      ".multi--price-sale--U-S0jtj"
    );

    return {
      amazon: amazonPrice,
      kabum: kabumPrice,
      mercadoLivre: mercadoLivrePrice,
      aliexpress: aliexpressPrice,
    };
  } finally {
    await driver.quit();
  }
}

async function fetchPrice(driver, url, query, selector) {
  await driver.get(url + encodeURIComponent(query));
  await driver.wait(until.elementLocated(By.css(selector)), 10000);

  let prices = [];
  const priceElements = await driver.findElements(By.css(selector));
  for (let priceElement of priceElements.slice(0, 5)) {
    const price = await priceElement.getText();
    prices.push(price);
  }

  return prices.length > 0 ? prices : ["Preço não encontrado"];
}

function formatPrices(prices, currency) {
  return prices
    .map((price, index) => `${index + 1}: ${currency}${price}`)
    .join("\n");
}

client.login(process.env.DISCORD_TOKEN);
