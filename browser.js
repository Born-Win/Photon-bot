const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteer.use(StealthPlugin());

async function _pause(timeout) {
    return new Promise((resolve) => setTimeout(() => resolve(), timeout));
}

async function _getSearchInput(page) {
    const SEARCH_INPUT_CLASS = '.c-autocomplete__input.js-intro';

    const searchInput = await page.$(`input${SEARCH_INPUT_CLASS}`);

    if (!searchInput) throw new Error('Photon search input not found');

    return searchInput;
}

async function _getSearchResultList(page) {
    const SEARCH_RESULT_ID = '#autoComplete_result_0';
    
    const searchResultList = await page.$(SEARCH_RESULT_ID);
    
    if (!searchResultList) throw new Error('Photon search result not found');

    return searchResultList;
}

async function searchContract(input, contract) {
    for (let i = 0; i < 50; i++) {
      await input.press('Backspace');
    }
    await input.type(contract);
}

async function openContract(browser, page, input, contract) {
    try {
        await searchContract(input, contract);
        await _pause(300)
        const searchResultList = await _getSearchResultList(page);
        const contracts = await searchResultList.$$eval('a', anchors => anchors.map(anchor => anchor.href));
        if (contracts[0]) {
            const newTab = await browser.newPage();
            await newTab.goto(contracts[0]);
        }
    } catch (err) {
        fs.appendFile('./error.txt', err.message + '\n', () => {});
    }
}

async function runBrowser() {
    try {
        const PHOTON_PAGE_URL = 'https://photon-sol.tinyastro.io/en/lp/82GqEQskTDCZ1eT5ryKPTha8ddntUaS3s6osmjyJJEtF?handle=667377ccfe59827969b8a';
        const EXAMPLE_CONTRACT = 'EtqDzr7c9J8GHm9rWUD2kXYSWkL78y29R4VDEEofpump';
    
        const options = {
            headless: false,
            ignoreHTTPSErrors: true,
            slowMo: 0,
            ignoreDefaultArgs: ['--enable-automation'],
            args: [
                // '--start-fullscreen',
                '--window-size=1400,900',
                '--disable-gpu',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
            ],
        }
    
        const browser = await puppeteer.launch(options);
    
        const page = await browser.newPage();
    
        await page.goto(PHOTON_PAGE_URL);
        
        await page.setViewport({width: 1500, height: 1024});

        await _pause(3 * 60 * 1000); // 3 minutes

        const searchInput = await _getSearchInput(page);
        await searchContract(searchInput, EXAMPLE_CONTRACT);
        await _pause(2 * 1000);

        return [browser, page, searchInput];
    } catch (err) {
        fs.appendFile('./error.txt', err.message + '\n', () => {});
        throw err;
    }
}

module.exports = {
    runBrowser,
    searchContract,
    openContract,
}