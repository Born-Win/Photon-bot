const TelegramApi = require('node-telegram-bot-api');

const token = '7750667497:AAH2JH2MCfI_3CuFptEmw8g_dVbMl74HVVg';
const bot = new TelegramApi(token, {polling: true});

function parseMessage(message) {
    const INDICATOR = 'ready!!!';
    const clearedMsg = message.trim();

    if (clearedMsg !== INDICATOR) return;

    return true;
}

module.exports = ((cb) => {
  bot.on("message", (msg, match) => {
    try {
        if (!msg.text) return;
        if (parseMessage(msg.text)) cb();
    } catch (err) {
        console.log(err);
    };
  });
});