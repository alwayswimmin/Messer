const chalk = require("chalk");
const imessage = require("osa-imessage");

/**
 * Wrapper around console.log
 * @param {String} content - content to log
 * @param {String} color - hexcode
 */
function log(content, color, error) {
  if (!content) return null;

  let message = content;

  // Don't format anything.
  // if (color) {
  //   if (chalk[color]) {
  //     message = chalk[color](content);
  //   }
  //   message = chalk.hex(color)(content);
  // }

  if (error) {
    console.error(error);
  }

  // console.log(message);
  imessage.send('+17035682167', message)
}

module.exports = { log };
