const imessage = require("osa-imessage");
const patterns = require("./util/patterns");
const puppeteer = require('puppeteer');
const fs = require("fs");

module.exports = messer => {
  return {
    primaryCommand: "request",

    help: 'request "<url>"',

    handler(command) {
      return new Promise((resolve, reject) => {
        const argv = command.match(patterns[3]);
        if (!argv || !argv[2])
          return reject(Error("Invalid request - check your syntax"));

        const url = argv[2];

        if (url.length === 0) {
          return reject(Error("Invalid request - check your syntax"));
        }

        async function retrieve(url, html_path, pdf_path) {
          const browser = await puppeteer.launch(/*{ headless: true }*/);
          const page = await browser.newPage();
          await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36");
          const response = await page.goto(url);
          const content = await response.text();
        	fs.writeFileSync(html_path, content);
          imessage.sendFile('samuel.c.hsiang@gmail.com', html_path)
          const pdf = await page.pdf({ format: 'A4', path: pdf_path });
          imessage.sendFile('samuel.c.hsiang@gmail.com', pdf_path);
          await browser.close();
        }

        html_path = '/Users/mercury/Downloads/response.html';
        pdf_path = '/Users/mercury/Downloads/response.pdf';
        return retrieve(url, html_path, pdf_path)
          .then(() => {
            return resolve(`Retrieved '${url}'`);
          })
          .catch((error) => {
            return reject(error);
          });
      });
    },
  };
};
