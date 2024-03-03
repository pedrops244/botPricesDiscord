import puppeteer from "puppeteer";
import { noProductResponse } from "./noProductResponse.js";

async function extractProductData(
  page,
  linkSelector,
  priceSelector,
  titleSelector
) {
  const link = await page
    .$eval(linkSelector, (element) => element.href)
    .catch(() => "Link não encontrado");
  let price = await page
    .$eval(priceSelector, (element) => element.textContent.trim())
    .catch(() => "Preço não encontrado");

  // Filtro apenas para a Amazon e remoção da vírgula no final do preço
  if (link.includes("amazon.com")) {
    price = price.replace(/,$/, "");
  }

  const title = await page
    .$eval(titleSelector, (element) => element.textContent)
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
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    const formattedQuery = url.includes("amazon.com.br")
      ? query.replace(/ /g, "+")
      : encodeURIComponent(query);
    await page.goto(url + formattedQuery);

    const isEmptyOrTimeout = await Promise.race([
      page
        .$eval(
          "div#listingEmpty, div.ui-search-icon--not-found",
          (elements) => elements.length > 0
        )
        .then(() => true)
        .catch(() => false),
      page
        .waitForSelector(linkSelector, { timeout: 10000 })
        .then(() => false)
        .catch(() => true),
    ]);

    if (isEmptyOrTimeout) {
      return noProductResponse();
    }

    const productElements = await page.$$(cardSelector);

    if (productElements.length === 0) {
      return noProductResponse();
    }

    const products = await Promise.all(
      productElements
        .slice(0, 5)
        .map(async (element) =>
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
    await browser.close();
  }
}
