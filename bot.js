import { Client, GatewayIntentBits } from "discord.js";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

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
  if (message.content.length < 20) {
    return message.channel.send(
      "Oops! Seu pedido precisa de mais detalhes, como modelo, marca, cor, etc. 🙈"
    );
  }

  if (message.content.startsWith("!preco")) {
    message.channel.send(
      `${client.user.displayName} está farejando os preços, aguarde! 🙉`
    );
    const query = message.content.slice("!preco".length);
    const amazonPrice = await fetchPrice(
      query,
      "https://www.amazon.com.br/s?k=",
      "span.a-price-whole"
    );

    // const pichauPrice = await fetchPrice(
    //   query.replace(/(^\s+|\s+$)/g, "").replace(/ /g, "%20"),
    //   "https://www.pichau.com.br/search?q=",
    //   "//*[contains(text(), 'no PIX com 15% desconto')]/parent::*"
    // );

    const kabumPrice = await fetchPrice(
      query.replace(/ /g, "-"),
      "https://www.kabum.com.br/busca/",
      ".priceCard"
    );
    const mercadoLivrePrice = await fetchPrice(
      query.replace(/ /g, "-"),
      "https://lista.mercadolivre.com.br/",
      ".andes-money-amount__fraction"
    );
    const aliexpressPrice = await fetchPrice(
      query.replace(/(^\s+|\s+$)/g, "").replace(/ /g, "%20"),
      "https://www.aliexpress.com/wholesale?SearchText=",
      ".multi--price-sale--U-S0jtj"
    );

    message.channel.send(`
      Amazon: R$ ${amazonPrice}
      Kabum: ${kabumPrice}
      MercadoLivre: R$ ${mercadoLivrePrice}
      AliExpress: ${aliexpressPrice}
    `);
  }
});

async function fetchPrice(query, url, selector) {
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
    await driver.wait(until.elementLocated(By.css(selector)), 10000);

    const priceElement = await driver.findElement(By.css(selector));
    const price = await priceElement.getText();
    return price || "Preço não encontrado";
  } catch (error) {
    console.error(`Erro ao buscar preço: ${error}`);
    return "Erro ao buscar preço";
  } finally {
    await driver.quit();
  }
}

client.login(
  "MTIxMTAyMzM0MTY3MTAzMDkxNA.GG7nEG.po4iGNnhkouJr2KRgG6pepJzqGNgssGX4mPtLM"
);
