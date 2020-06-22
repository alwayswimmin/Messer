const imessage = require("osa-imessage");
const patterns = require("./util/patterns");
const puppeteer = require('puppeteer')

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

        async function retrieve(url, path) {
          const browser = await puppeteer.launch(/*{ headless: true }*/);
          const page = await browser.newPage();
          // await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36");
          const response = await page.goto(url, {waitUntil: 'networkidle0'});
          const content = await response.text();
          console.log(content);
          imessage.send('samuel.c.hsiang@gmail.com', content)
          const pdf = await page.pdf({ format: 'A4', path: path });
          imessage.sendFile('samuel.c.hsiang@gmail.com', path);
          await browser.close();
        }

        path = '//Users/mercury/Downloads/response.pdf';
        return retrieve(url, path)
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
