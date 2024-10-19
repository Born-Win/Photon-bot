const { runBrowser, openContract } = require('./browser');
const telegramBot = require('./telegram-bot');
const fs = require('fs');


(async () => {
    try {
        const [browser, searchInput, searchResultList] = await runBrowser();
        telegramBot((contract) => openContract(browser, searchInput, searchResultList, contract));
    } catch (err) {
        fs.appendFile('./error.txt', err.message, () => {});
    }
})();
