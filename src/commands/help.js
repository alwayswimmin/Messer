const { objectValues } = require("../util/helpers");

module.exports = messer => {
  return {
    primaryCommand: "help",

    help: "help",

    handler() {
      const help = objectValues(messer._commandRegistry.commands)
        .map(command => {
          return `${command.primaryCommand}\n\t${command.help}`;
        })
        .join("\n");

      const helpPretty = `Commands:\n\n${help}`;

      return Promise.resolve(helpPretty);
    },
  };
};
