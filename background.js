

console.log("init")

const tabsArray = []

async function initExt() {

    console.log("Вызвана функция initExt()")

    // Загружаем данные флагов
    const flagsData = await loadFlagsData();

    await chrome.tabs.query({}, async (tabs) => {
        for (let i = 0; i < tabs.length; i++) {
            const url = new URL(tabs[i].url);
            const hostname = url.hostname;
            let flagImg = await getFlagImage(hostname, flagsData);
            tabsArray.push({
                id: tabs[i].id,
                hostname,
                flagImg
            })
        }
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.active) {
            const url = new URL(tab.url);
            const hostname = url.hostname;
            let flagImg = await getFlagImage(hostname, flagsData);
            chrome.action.setIcon({ path: `${flagImg.flag}`, tabId})
            chrome.action.setTitle({ title: `Сервер сайта находится в ${flagImg.countryName}`, tabId });
            tabsArray.push({
                id: tabId,
                hostname,
                flagImg
            })           
        }

    });

    console.log(tabsArray)
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // console.log(`Вкладка ${activeInfo.tabId} теперь активна в окне ${activeInfo.windowId}`);
    let isExist = false;
    let elem;
    tabsArray.forEach(el => {
        if (el.id === activeInfo.tabId) {
            elem = el
            isExist = true
            return
        }
    })
    if(isExist){        
        chrome.action.setIcon({ path: `${elem.flagImg.flag}`, tabId: activeInfo.tabId });
        chrome.action.setTitle({ title: `Сервер сайта находится в ${elem.flagImg.countryName}`, tabId: activeInfo.tabId });
    } else {
        console.log('Ещё нет в списке', activeInfo.tabId)
    }
});

async function getFlagImage(hostname, flagsData) {

    if (hostname === "extensions") {
        return {
            countryName: "браузер Chrome",
            flag: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAMxJREFUKFNjZCARMGJT/8bINIHhHwODyIXTC9DlUTS8NTL/j80A4XMn4ergDFyKQQaATBGBaoJrWHHe9b9r8icGNndXBl6zYrBF/93LGBj+rAWzGfnegdWCieVnnRIYmZjn2xd9ZZDM24riqv/OylD+vyRGvg/zwRqWnXeOZ2JgAnsw4sEqXBoSGfk+LEBxEkilnIAjg9WFTKiTShgY/qzHdBJIBOQH9BAKVz4LF0LxA0wUWRM2xXBPo5u84qJLXLjiGSaQm/FGHDGpBACwJkMN0HyvrgAAAABJRU5ErkJggg=='
        }
    }

    try {
        const ip = await fetch(`https://dnsjson.com/${hostname}/A.json`)
            .then(response => response.json())
            .then(data => {
                return data["results"]["records"];
            });

        const response = await fetch(`https://ipapi.co/${ip[0]}/json/`);
        const data = await response.json();
        const countryCode = data.country_code;
        const countryName = data.country_name;

        if (countryCode && countryName) {
            // Получаем изображение флага из данных
            const flagData = flagsData[countryCode.toUpperCase()];
            if (flagData && flagData.bigFlagImg) {
                // chrome.action.setIcon({ path: `data:image/png;base64,${flagData.flagImg}` });
                return {
                    countryName,
                    flag: `data:image/png;base64,${flagData.flagImg}`
                }
            } else {
                countryNameElement.textContent = 'Flag not found';
            }
        } else {
            countryNameElement.textContent = 'Country not found';
        }
    } catch (error) {
        console.error('Ошибка при получении страны:', error);
    }
}

// Загружаем данные флагов из файла convertedFlags.json
async function loadFlagsData() {
    const response = await fetch(chrome.runtime.getURL('convertedFlags.json'));
    return response.json();
}

async function searchId(id) {
    data = await loadFlagsData()
    console.log(data)

}

initExt()