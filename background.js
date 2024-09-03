console.log("init");

const tabsArray = [];

async function initExt() {
    console.log("Вызвана функция initExt()");

    // Загружаем данные флагов
    const flagsData = await loadFlagsData();

    // Запрашиваем все вкладки
    const tabs = await new Promise((resolve) => {
        chrome.tabs.query({}, (result) => resolve(result));
    });

    for (let tab of tabs) {
        const url = new URL(tab.url);
        const hostname = url.hostname;
        const flagImg = await getFlagImage(hostname, flagsData);
        tabsArray.push({
            id: tab.id,
            hostname,
            flagImg
        });
    }

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.active) {
            const url = new URL(tab.url);
            const hostname = url.hostname;
            const flagImg = await getFlagImage(hostname, flagsData);
            chrome.action.setIcon({ path: { "16": flagImg.flag }, tabId });
            chrome.action.setTitle({ title: `Сервер сайта находится в ${flagImg.countryName}`, tabId });
            tabsArray.push({
                id: tabId,
                hostname,
                flagImg
            });
        }
    });

    console.log(tabsArray);
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = tabsArray.find(el => el.id === activeInfo.tabId);
    if (tab) {
        chrome.action.setIcon({ path: { "16": tab.flagImg.flag }, tabId: activeInfo.tabId });
        chrome.action.setTitle({ title: `Сервер сайта находится в ${tab.flagImg.countryName}`, tabId: activeInfo.tabId });
    } else {
        console.log('Ещё нет в списке', activeInfo.tabId);
    }
});

async function getFlagImage(hostname, flagsData) {
    if (hostname === "extensions") {
        return {
            countryName: "браузер Chrome",
            flag: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAMxJREFUKFNjZCARMGJT/8bINIHhHwODyIXTC9DlUTS8NTL/j80A4XMn4ergDFyKQQaATBGBaoJrWHHe9b9r8icGNndXBl6zYrBF/93LGBj+rAWzGfnegdWCieVnnRIYmZjn2xd9ZZDM24riqv/OylD+vyRGvg/zwRqWnXeOZ2JgAnsw4sEqXBoSGfk+LEBxEkilnIAjg9WFTKiTShgY/qzHdBJIBOQH9BAKVz4LF0LxA0wUWRM2xXBPo5u84qJLXLjiGSaQm/FGHDGpBACwJkMN0HyvrgAAAABJRU5ErkJggg=='
        };
    }

    try {
        const ipResponse = await fetch(`https://dnsjson.com/${hostname}/A.json`);
        const ipData = await ipResponse.json();
        const ip = ipData.results.records[0];

        const countryResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        const countryData = await countryResponse.json();
        const countryCode = countryData.country_code;
        const countryName = countryData.country_name;

        if (countryCode && countryName) {
            const flagData = flagsData[countryCode.toUpperCase()];
            if (flagData && flagData.bigFlagImg) {
                return {
                    countryName,
                    flag: `data:image/png;base64,${flagData.bigFlagImg}`
                };
            } else {
                return {
                    countryName,
                    flag: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAYAAAA7KqwyAAAAAXNSR0IArs4c6QAAAXRJREFUKFNj/PPnz38GJPD27VtkLoOwsDAKH12e8f///3ADQMyXL18ywIS+fPnCoKKiwsDIyAg2BF0eJAY2QGT1PYY3oUpgBbxLbzHcduZjSEtJYpg1Zx6DpKQkg6+3J8PmrdsZbvMJMXBdvwwyieGrpi4D761rDIwgLzAzM8NtePHiBQP/CSmGjxbPwGIgA0AGX3synUFLJhPFhWAXIBvw/ft3hhfPnzNwcHIy/Pj+nYHt91WGXW9iGCKNXzKws7MzvH/3nuHX719wL4IMBnthzZ4jDLlvxRjuC2gzXOA7zCCvIM9w/tw5hta2JobsvjMMJgLXGNTU1RlO19UyXJm3iEFRXZnhh4gwg/6ESRADYMH8ZQUjwxeH53Ab+I5IMSyTZGRItfkH9+LE/SwM4ZpP4DGDEQuf5rIwsMrwMPx58Znhq/tTBhEREYbZx9kZ3r7UZOASusEQrf0UbgE4DP79+4cSja9fv0ZRIC4uDrcN5Fh0eQCCJcxMnIse7gAAAABJRU5ErkJggg=='
                };
            }
        } else {
            return {
                countryName: 'Country not found',
                flag: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAYAAAA7KqwyAAAAAXNSR0IArs4c6QAAAXRJREFUKFNj/PPnz38GJPD27VtkLoOwsDAKH12e8f///3ADQMyXL18ywIS+fPnCoKKiwsDIyAg2BF0eJAY2QGT1PYY3oUpgBbxLbzHcduZjSEtJYpg1Zx6DpKQkg6+3J8PmrdsZbvMJMXBdvwwyieGrpi4D761rDIwgLzAzM8NtePHiBQP/CSmGjxbPwGIgA0AGX3synUFLJhPFhWAXIBvw/ft3hhfPnzNwcHIy/Pj+nYHt91WGXW9iGCKNXzKws7MzvH/3nuHX719wL4IMBnthzZ4jDLlvxRjuC2gzXOA7zCCvIM9w/tw5hta2JobsvjMMJgLXGNTU1RlO19UyXJm3iEFRXZnhh4gwg/6ESRADYMH8ZQUjwxeH53Ab+I5IMSyTZGRItfkH9+LE/SwM4ZpP4DGDEQuf5rIwsMrwMPx58Znhq/tTBhEREYbZx9kZ3r7UZOASusEQrf0UbgE4DP79+4cSja9fv0ZRIC4uDrcN5Fh0eQCCJcxMnIse7gAAAABJRU5ErkJggg=='
            };
        }
    } catch (error) {
        console.error('Ошибка при получении страны:', error);
        return {
            countryName: 'Error',
            flag: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAYAAAA7KqwyAAAAAXNSR0IArs4c6QAAAXRJREFUKFNj/PPnz38GJPD27VtkLoOwsDAKH12e8f///3ADQMyXL18ywIS+fPnCoKKiwsDIyAg2BF0eJAY2QGT1PYY3oUpgBbxLbzHcduZjSEtJYpg1Zx6DpKQkg6+3J8PmrdsZbvMJMXBdvwwyieGrpi4D761rDIwgLzAzM8NtePHiBQP/CSmGjxbPwGIgA0AGX3synUFLJhPFhWAXIBvw/ft3hhfPnzNwcHIy/Pj+nYHt91WGXW9iGCKNXzKws7MzvH/3nuHX719wL4IMBnthzZ4jDLlvxRjuC2gzXOA7zCCvIM9w/tw5hta2JobsvjMMJgLXGNTU1RlO19UyXJm3iEFRXZnhh4gwg/6ESRADYMH8ZQUjwxeH53Ab+I5IMSyTZGRItfkH9+LE/SwM4ZpP4DGDEQuf5rIwsMrwMPx58Znhq/tTBhEREYbZx9kZ3r7UZOASusEQrf0UbgE4DP79+4cSja9fv0ZRIC4uDrcN5Fh0eQCCJcxMnIse7gAAAABJRU5ErkJggg=='
        };
    }
}

// Загружаем данные флагов из файла convertedFlags.json
async function loadFlagsData() {
    const response = await fetch(chrome.runtime.getURL('convertedFlags.json'));
    return response.json();
}

initExt();
