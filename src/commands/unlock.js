module.exports = messer => {
  return {
    primaryCommand: "--unlock",

    help: "--unlock",

    handler() {
      return new Promise((resolve, reject) => {
        if (!messer.lock.isLocked()) {
          return reject(Error("No current locked user"));
        }

        const threadName = messer.lock.getLockedTarget();
        messer.lock.unlock();
        // messer.setPrompt("> ");
        messer.setPrompt("");
        return resolve(`Unlocked from ${threadName}`);
      });
    },
  };
};
