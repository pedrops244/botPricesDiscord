import { Builder } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

export async function createWebDriver() {
  let options = new chrome.Options();
  options.addArguments(
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--enable-chrome-browser-cloud-management"
  );
  return new Builder().forBrowser("chrome").setChromeOptions(options).build();
}
