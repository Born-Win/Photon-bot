const TelegramApi = require('node-telegram-bot-api');

const token = '7750667497:AAH2JH2MCfI_3CuFptEmw8g_dVbMl74HVVg';
const bot = new TelegramApi(token, {polling: true});

function parseMessage(message) {
    const CONTRACT_INDICATOR = '合约';
    const clearedMsg = message.trim();

    if (!clearedMsg.includes(CONTRACT_INDICATOR)) return;

    const contract = clearedMsg.substring(clearedMsg.indexOf(CONTRACT_INDICATOR) + CONTRACT_INDICATOR.length + 1);
    
    return contract;
}

module.exports = ((cb) => {
  bot.on("message", (msg, match) => {
    try {
        if (!msg.text) return;
        const contract = parseMessage(msg.text);
        if (!contract) return;
        cb(contract);
    } catch (err) {
        console.log(err);
    };
  });
});