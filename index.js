const Scrapping = require('./browser');
const telegramBot = require('./telegram-bot');
const fs = require('fs');


(async () => {
    try {
        const scrappingBot = new Scrapping();
        await scrappingBot.init();
        console.log('Bot inited');
        telegramBot(() => { scrappingBot.launchApp(); });
    } catch (err) {
        fs.appendFile('./error.txt', err.message + '\n', () => {});
    }
})();
