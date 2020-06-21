const { Messen } = require("messen");
const imessage = require("osa-imessage");
const logger = require("../util/logger");

const settings = require("./settings");
const helpers = require("../util/helpers");
const lock = require("./lock");
const messageEventHandler = require("../event-handlers/message");
const eventEventHandler = require("../event-handlers/event");

const _getMessen = ctx => {
  const messen = new Messen({
    dir: process.env.APP_DIR,
  });

  messen.getMfaCode = () => helpers.promptCode();
  messen.promptCredentials = () => helpers.promptCredentials();
  messen.onMessage = ev => {
    const { handler } = messageEventHandler(ctx);
    return handler(ev);
  };
  messen.onThreadEvent = ev => {
    const { handler } = eventEventHandler(ctx);
    return handler(ev);
  };

  return messen;
};

/**
 * Main Messer class
 * @class
 */
function Messer(options = {}) {
  this._commandRegistry = {
    commands: {},
    shortcutMap: {},
  };
  this._eventHandlers = {};

  this.options = options;
  this.messen = _getMessen(this);
  this.state = {
    threads: {
      lastThreadId: undefined,
      unreadThreadIds: [],
    },
  };
}

Messer.prototype.registerCommand = function registerCommand(command) {
  const { primaryCommand, shortcutCommand, help, handler } = command;
  if (!primaryCommand || !help || !handler) {
    throw new Error("Invalid Command");
  }

  if (this._commandRegistry.commands[primaryCommand]) {
    throw new Error(`Command [${primaryCommand}] already registered`);
  }

  if (this._commandRegistry.shortcutMap[shortcutCommand]) {
    throw new Error(`Shortcut [${shortcutCommand}] already registered`);
  }

  this._commandRegistry.commands[primaryCommand] = command;
  if (shortcutCommand) {
    this._commandRegistry.shortcutMap[shortcutCommand] = primaryCommand;
  }
};

Messer.prototype.registerEventHandler = function registerEventHandler(
  eventHandler,
) {
  const { eventType, handler } = eventHandler;
  if (!eventType || !handler) {
    throw new Error("Invalid Event Handler");
  }

  this._eventHandlers[eventType] = handler;
};

Messer.prototype.log = logger.log;

/**
 * Starts a Messer session.
 */
Messer.prototype.start = function start(interactive = true, rawCommand) {
  helpers.notifyTerminal();
  console.log("Logging in...");

  return this.messen
    .login()
    .then(() => {
      if (!interactive) {
        return this.processCommand(rawCommand).then(res => {
          console.log(res);
        });
      }

      console.log(
        `Successfully logged in as ${this.messen.store.users.me.user.name}`,
      );

      this.messen.listen();

      imessage.listen().on('message', (msg) => {
        if (!msg.fromMe && msg.handle == 'samuel.c.hsiang@gmail.com') {
          console.log(`> ${msg.text}`);
          this.processCommand(msg.text)
            .then(res => {
              logger.log(res);
            })
            .catch(err => {
              logger.log(err.message);
            });
        }
      })
    })
    .catch(err => {
      console.log(err.message || err);
      // recur
      // return this.start(interactive, rawCommand);
    });
};

Messer.prototype.processCommand = function processCommand(rawCommand) {
  // ignore if rawCommand is only spaces
  if (rawCommand.trim().length === 0) return Promise.resolve();

  let argv = rawCommand.match(/([A-z]+).*/);

  // if we're in a lock, hack args to use the `message` command
  if (this.lock.isLocked()) {
    argv = rawCommand.match(/.*/);
    if (rawCommand.startsWith("--unlock")) {
      argv[1] = "--unlock";
      rawCommand = "--unlock";
    } else {
      argv[1] = "message";
      rawCommand = `message "${this.lock.getLockedTarget()}" ${rawCommand}`;
    }
  }

  if (!argv || !argv[1]) {
    return Promise.reject(Error("Invalid command - check your syntax"));
  }

  let commandEntry = this._commandRegistry.commands[argv[1]];
  if (!commandEntry) {
    commandEntry = this._commandRegistry.commands[
      this._commandRegistry.shortcutMap[argv[1]]
    ];
  }

  if (!commandEntry) {
    return Promise.reject(Error("Invalid command - check your syntax"));
  }

  return commandEntry.handler(rawCommand).then(res => {
    // TODO(tom) might be a better way to handle this (probably in the message funciton itself)
    if (!this.lock.isLocked() || !this.lock.isSecret()) return res;

    // delete the last message
    commandEntry = this._commandRegistry.commands.delete;
    const deleteCommand = `delete "${lock.getLockedTarget()}" 1`;
    return commandEntry.handler(deleteCommand).then(() => {
      return res;
    });
  });
};

/**
 * Clears the messer notification in the terminal title.
 */
Messer.prototype.clear = function clear() {
  if (this.settings.get("SHOW_READ") === true) {
    new Set(this.unreadThreadIds).forEach(threadId => {
      this.messen.api.markAsRead(threadId);
    });
  }

  this.unreadThreadIds = [];

  helpers.notifyTerminal();
};

/**
 * Terminates the Messer session and removes all relevent files.
 */
Messer.prototype.logout = function logout() {
  return this.messen.logout().then(() => {
    process.exit();
  });
};

Messer.prototype.settings = settings;

Messer.prototype.lock = lock;

module.exports = Messer;
