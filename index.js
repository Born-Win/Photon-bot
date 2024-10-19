const { runBrowser, openContract } = require('./browser');
const telegramBot = require('./telegram-bot');
const fs = require('fs');


(async () => {
    try {
        const [browser, page, searchInput] = await runBrowser();
        telegramBot((contract) => openContract(browser, page, searchInput, contract));
    } catch (err) {
        fs.appendFile('./error.txt', err.message + '\n', () => {});
    }
})();
