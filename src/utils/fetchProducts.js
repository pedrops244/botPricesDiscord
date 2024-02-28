import { By, until } from "selenium-webdriver";
import { createWebDriver } from "../config/webdriver.js";
import { noProductResponse } from "./noProductResponse.js";

async function extractProductData(
  productElement,
  linkSelector,
  priceSelector,
  titleSelector
) {
  const link = await productElement
    .findElement(By.css(linkSelector))
    .getAttribute("href")
    .catch(() => "Link não encontrado");
  const price = await productElement
    .findElement(By.css(priceSelector))
    .getText()
    .catch(() => "Preço não encontrado");
  const title = await productElement
    .findElement(By.css(titleSelector))
    .getText()
    .catch(() => "Título não encontrado");
  return { link, price, title };
}

export async function fetchProducts(
  url,
  query,
  cardSelector,
  linkSelector,
  priceSelector,
  titleSelector
) {
  const driver = await createWebDriver();

  try {
    const formattedQuery = url.includes("amazon.com.br")
      ? query.replace(/ /g, "+")
      : encodeURIComponent(query);
    await driver.get(url + formattedQuery);

    const isEmptyOrTimeout = await Promise.race([
      driver
        .findElements(By.css("div#listingEmpty, div.ui-search-icon--not-found"))
        .then((elements) => elements.length > 0),
      driver.wait(until.elementLocated(By.css(linkSelector)), 10000).then(
        () => false,
        () => true
      ),
    ]);
    if (isEmptyOrTimeout) {
      return noProductResponse();
    }
    await driver
      .wait(until.elementLocated(By.css(linkSelector)), 10000)
      .catch(() => {});
    const productElements = await driver.findElements(By.css(cardSelector));

    if (productElements.length === 0) return noProductResponse();

    const products = await Promise.all(
      productElements
        .slice(0, 5)
        .map((element) =>
          extractProductData(
            element,
            linkSelector,
            priceSelector,
            titleSelector
          )
        )
    );

    return (
      products.filter((product) => product.link !== "Link não encontrado") ||
      noProductResponse()
    );
  } finally {
    await driver.quit();
  }
}
