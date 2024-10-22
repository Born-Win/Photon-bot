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
    }

    async init() {
        await this.runBrowser();
    }

    async runBrowser() {
        try {
            const PHOTON_PAGE_URL = 'https://photon-sol.tinyastro.io/en/lp/82GqEQskTDCZ1eT5ryKPTha8ddntUaS3s6osmjyJJEtF?handle=667377ccfe59827969b8a';
        
            this.browser = await puppeteer.launch(this.browserOptions);
        
            this.photonPage = await this.browser.newPage();
        
            await this.photonPage.goto(PHOTON_PAGE_URL);
            
            await this.photonPage.setViewport({width: 1500, height: 1024});
        } catch (err) {
            this._callError(err);
        }
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
        
        if (!searchResultList) throw new Error('Photon search result not found');
    
        return searchResultList;
    }
    
    async _searchContract(input, contract) {
        // for (let i = 0; i < 50; i++) {
        //     await this.searchInput.press('Backspace');
        // }
        // await this.searchInput.type(contract);
        await input.type(contract);
    }

    async _clearContract() {
        for (let i = 0; i < 50; i++) {
            await this.searchInput.press('Backspace');
        }
    }
    
    async _openContract(contract) {
        try {
            const searchInput = await this._getSearchInput();
            await this._searchContract(searchInput, contract);
            await this._pause(500);
            const searchResultList = await this._getSearchResultList();
            const contracts = await searchResultList.$$eval('a', anchors => anchors.map(anchor => anchor.href));
            if (contracts[0]) {
                const newTab = await this.browser.newPage();
                await newTab.goto(contracts[0]);
                this.photonPage = newTab;
            }
        } catch (err) {
            this._callError(err);
        }
    }

    async launchApp() {
        if (this.launched) return;

        const pages = await this.browser.pages();

        for (const page of pages) {
          const url = await page.url();

          if (url.includes('web.telegram.org')) {
            this.telegramPage = page;
          }
        }

        if (!this.telegramPage) throw new Error('Telegram is not opened');

        console.log('App launched');

        this.launched = true;

        await this._pause(10 * 10000);
        setInterval(() => {
            this.getLastTelegramMessage(this.telegramPage).catch(err => {
                fs.appendFile('./error.txt', err.message + '\n', () => {});
            });
        }, 1000);
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
        const MESSAGES_GROUP_LAST_WRAPPER_CLASS = '.bubbles-group.bubbles-group-last';
        const MESSAGE_WRAPPER_CLASS = '.bubble';
        const MESSAGE_CLASS = '.message.spoilers-container';
        // const CONTENT_WRAPPER_CLASS = '.text-content';
        // const SPAN_BLOCK_IN_MESSAGE = '<span';
        const CONTRACT_BLOCK_CLASS = '.monospace-text';

        const lastMessageGroup = await page.$(MESSAGES_GROUP_LAST_WRAPPER_CLASS);

        if (!lastMessageGroup) throw new Error('Last messages group not found');

        const lastMessageWrapper = await lastMessageGroup.$(MESSAGE_WRAPPER_CLASS);

        if (!lastMessageWrapper) throw new Error('Last message wrapper not found');

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
        if (!textArray.length) return;

        // const clearedMsg = message.substring(0, message.indexOf(SPAN_BLOCK_IN_MESSAGE));

        // console.log(message);
        // const contract = this._telegramMsgParser(message); // change this functionality for your parser

        // if (!contract) return;

        this._openContract(textArray[1]).catch(err => {
            fs.appendFile('./error.txt', err.message + '\n', () => {});
        });
    }
    
    // async getLastTelegramMessage(page) {
    //     const LAST_MESSAGE_CLASS = '.Message.message-list-item.last-in-list';
    //     const CONTENT_WRAPPER_CLASS = '.text-content';
    //     const SPAN_BLOCK_IN_MESSAGE = '<span';

    //     const lastMessage = await page.$(LAST_MESSAGE_CLASS);

    //     if (!lastMessage) throw new Error('Last message not found');

    //     const lastMsgId = await page.evaluate(el => el.id, lastMessage);
    //     if (lastMsgId === this.telegramLastMsgId) return;

    //     this.telegramLastMsgId = lastMsgId;

    //     const contentBlock = await lastMessage.$(CONTENT_WRAPPER_CLASS);

    //     if (!contentBlock) throw new Error('Content of last message not found');

    //     const message = await page.evaluate(el => el.innerHTML, contentBlock);

    //     const clearedMsg = message.substring(0, message.indexOf(SPAN_BLOCK_IN_MESSAGE));

    //     const contract = this._telegramMsgParser(clearedMsg); // change this functionality for your parser

    //     if (!contract) return;

    //     this._openContract(contract).catch(err => {
    //         fs.appendFile('./error.txt', err.message + '\n', () => {});
    //     });
    // }

    _callError(err) {
        fs.appendFile('./error.txt', err.message + '\n', () => {});
        throw err;
    }
}
