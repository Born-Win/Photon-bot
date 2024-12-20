const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
puppeteer.use(StealthPlugin());

module.exports = class Scrapping {
    constructor() {
        this.browserOptions = {
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
        this.EXAMPLE_CONTRACT = 'EtqDzr7c9J8GHm9rWUD2kXYSWkL78y29R4VDEEofpump';
        this.telegramLastMsgId = '';
        this.telegramMsgCount = 0;
        this.openingAttempts = 5;
    }

    async init() {
        await this.runBrowser();
    }

    async runBrowser() {
        try {
            // const PHOTON_PAGE_URL = 'https://photon-sol.tinyastro.io/en/lp/82GqEQskTDCZ1eT5ryKPTha8ddntUaS3s6osmjyJJEtF?handle=667377ccfe59827969b8a';
            const SOLANA_PAGE_URL = 'https://mevx.io/solana/BvBjkVmgEsL5hHMvRvzC3yJWbJnijpFQw6gmkTpkpump'
            const TELEGRAM_PAGE_URL = 'https://web.telegram.org/';

            this.browser = await puppeteer.launch(this.browserOptions);
        
            this.solanaPage = await this.browser.newPage();
        
            await this.solanaPage.goto(SOLANA_PAGE_URL);
            
            await this.solanaPage.setViewport({width: 1500, height: 1024});
            // this.photonPage = await this.browser.newPage();
        
            // await this.photonPage.goto(PHOTON_PAGE_URL);
            
            // await this.photonPage.setViewport({width: 1500, height: 1024});

            this.browserTelegram = await puppeteer.launch(this.browserOptions);

            this.telegramPage = await this.browserTelegram.newPage();

            await this.telegramPage.goto(TELEGRAM_PAGE_URL);

            await this.telegramPage.setViewport({width: 500, height: 1024});
        } catch (err) {
            this._callError(err);
        }
    }

    async scrollToButton(page) {
        await page.evaluate(() => {
            const ELEMENT_TO_SCROLL_CLASS = '.MessageList.custom-scroll';
            const element = document.querySelector(ELEMENT_TO_SCROLL_CLASS);
            if (element) {
                element.scrollTop = element.scrollHeight;
            } else {
                throw new Error("Element with the specified classes not found");
            }
        });
    }

    async _pause(timeout) {
        return new Promise((resolve) => setTimeout(() => resolve(), timeout));
    }
    
    async _getSearchInput() {
        const SEARCH_INPUT_CLASS = '.c-autocomplete__input.js-intro';
    
        const searchInput = await this.photonPage.$(`input${SEARCH_INPUT_CLASS}`);
    
        if (!searchInput) throw new Error('Photon search input not found');
    
        return searchInput;
    }
    
    async _getSearchResultList() {
        const SEARCH_RESULT_ID = '#autoComplete_result_0';
        
        const searchResultList = await this.photonPage.$(SEARCH_RESULT_ID);
        
        if (!searchResultList) return;
    
        return searchResultList;
    }
    
    async _searchContract(input, contract) {
        await input.type(contract);
    }

    async _clearContract(searchInput) {
        for (let i = 0; i < 50; i++) {
            await searchInput.press('Backspace');
        }
    }

    async _openContract(contract) {
        const PLATFORM_URL = 'https://mevx.io/solana' ;
        
        try {
            const newTab = await this.browser.newPage();
            await newTab.goto(`${PLATFORM_URL}/${contract}`);
        } catch (err) {
            this._callError(err);
        }
    }

    // async _openContract(contract, attempts=0) {
    //     try {
    //         const searchInput = await this._getSearchInput();
    //         await this._searchContract(searchInput, contract);
    //         await this._pause(500);
    //         let searchResultList = await this._getSearchResultList();

    //         // const openAttempts = 5;

    //         // for (let i = 0; i < openAttempts; i++) {
    //         //     await this._pause(100);
    //         //     searchResultList = await this._getSearchResultList();
    //         //     if (searchResultList) break;
    //         // }

    //         if (!searchResultList) {
    //             this._clearContract(searchInput);
    //             if (attempts < this.openingAttempts) {
    //                 return this._openContract(contract, ++attempts);
    //             }
    //             throw new Error('Photon search result not found');
    //         }

    //         const contracts = await searchResultList.$$eval('a', anchors => anchors.map(anchor => anchor.href));
    //         if (contracts[0]) {
    //             const newTab = await this.browser.newPage();
    //             await newTab.goto(contracts[0]);
    //             this.photonPage = newTab;
    //         }
    //     } catch (err) {
    //         this._callError(err);
    //     }
    // }

    async launchApp() {
        if (this.launched) return;

        console.log('App launched');

        this.launched = true;

        await this._pause(5 * 1000);
        setInterval(() => {
            this.getLastTelegramMessage(this.telegramPage).catch(err => {
                fs.appendFile('./error.txt', err.message + '\n', () => {});
            });
        }, 1000);

        setInterval(() => {
            this.scrollToButton(this.telegramPage).catch((err) => { this._callError(err); });
        }, 20 * 1000);
    }

    _telegramMsgParser(message) {
        const CONTRACT_INDICATOR = '合约';
        const CODE_INDICATOR = '</code>';
        const PRE_CODE_INDICATOR = '"MessageEntityCode">';
        const clearedMsg = message.trim();
    
        if (!clearedMsg.includes(CONTRACT_INDICATOR)) return;

        let contract;

        if (clearedMsg.includes(PRE_CODE_INDICATOR)) {
            const substr = clearedMsg.substring(clearedMsg.indexOf(CONTRACT_INDICATOR));
            contract = substr.substring(substr.indexOf(PRE_CODE_INDICATOR) + PRE_CODE_INDICATOR.length, substr.indexOf(CODE_INDICATOR))
        } else {
            contract = clearedMsg.substring(clearedMsg.indexOf(CONTRACT_INDICATOR) + CONTRACT_INDICATOR.length + 1);
        }
        
        return contract;
    }
    
    async getLastTelegramMessage(page) {
        if (this.notBubble) {
            return this.getLastTelegramMessageNoBubble(page);
        }
        const MESSAGES_GROUP_LAST_WRAPPER_CLASS = '.bubbles-group.bubbles-group-last';
        const MESSAGE_WRAPPER_CLASS = '.bubble';
        const MESSAGE_CLASS = '.message.spoilers-container';
        const CONTRACT_BLOCK_CLASS = '.monospace-text';

        const lastMessageGroup = await page.$(MESSAGES_GROUP_LAST_WRAPPER_CLASS);

        if (!lastMessageGroup) {
            this.notBubble = true;
            return;
        }

        const messageWrappers = await lastMessageGroup.$$(MESSAGE_WRAPPER_CLASS);

        if (!messageWrappers.length) throw new Error('List of message wrapper not found');

        const lastMessageWrapper = messageWrappers[messageWrappers.length - 1];

        const lastMsgId = await page.evaluate(el => el.getAttribute('data-mid'), lastMessageWrapper);

        console.log(lastMsgId, this.telegramLastMsgId);

        if (lastMsgId === this.telegramLastMsgId) return;

        this.telegramLastMsgId = lastMsgId;

        const contentBlock = await lastMessageWrapper.$(MESSAGE_CLASS);

        if (!contentBlock) throw new Error('Content of last message not found');

        const textArray = await contentBlock.$$eval(CONTRACT_BLOCK_CLASS, elements => 
            elements.map(element => element.textContent.trim())
        );

        console.log(textArray);

        if (!textArray.length || textArray.length != 2) return;

        this._openContract(textArray[1]).catch(err => {
            fs.appendFile('./error.txt', err.message + '\n', () => {});
        });
    }
    
    async getLastTelegramMessageNoBubble(page) {
        const LAST_MESSAGE_CLASS = '.Message.message-list-item.last-in-list';
        const CONTENT_WRAPPER_CLASS = '.text-content';
        const CONTRACT_BLOCK_CLASS = '.text-entity-code';

        const lastMessage = await page.$(LAST_MESSAGE_CLASS);

        if (!lastMessage) throw new Error('Last message not found');

        const lastMsgId = await page.evaluate(el => el.id, lastMessage);

        console.log(lastMsgId, this.telegramLastMsgId);

        if (lastMsgId === this.telegramLastMsgId) return;

        this.telegramLastMsgId = lastMsgId;

        const contentBlock = await lastMessage.$(CONTENT_WRAPPER_CLASS);

        if (!contentBlock) throw new Error('Content of last message not found');

        const textArray = await contentBlock.$$eval(CONTRACT_BLOCK_CLASS, elements => 
            elements.map(element => element.textContent.trim())
        );

        console.log(textArray);

        if (!textArray.length || textArray.length != 2) return;

        this._openContract(textArray[1]).catch(err => {
            fs.appendFile('./error.txt', err.message + '\n', () => {});
        });
    }

    _callError(err) {
        fs.appendFile('./error.txt', err.message + '\n', () => {});
        throw err;
    }
}
