console.log("init");

// Массив для хранения информации о вкладках и их флагах
const tabsArray = [];

// Загружаем данные флагов из файла convertedFlags.json
async function loadFlagsData() {
    const response = await fetch(chrome.runtime.getURL('convertedFlags.json'));
    return response.json();
}


// Основная функция инициализации расширения
async function initExt() {
    console.log("Вызвана функция initExt()");

    const flags = await loadFlagsData();

    // Получаем список всех вкладок
    const tabs = await new Promise((resolve) => {
        chrome.tabs.query({}, (result) => resolve(result));
    });

    // Проходим по каждой вкладке и собираем данные о флаге
    for (let tab of tabs) {
        const url = new URL(tab.url); // Создаем объект URL для получения хостнейма
        const hostname = url.hostname; // Извлекаем хостнейм из URL
        const result = await getFlagImage(hostname)
        chrome.action.setIcon({ path: "data:image/png;base64," + result.flagImg, tabId: tab.id })
        chrome.action.setTitle({ title: `Сервер сайта находится в \n${result.countryName}`, tabId: tab.id })
        // console.log("result ", result, "hostname ", hostname)
        tabsArray.push({
            tabId: tab.id,
            hostname,
            flagImg: result.flagImg,
            ips: result.ips,
            countryName: result.countryName
        })
    }

    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        const result = await tabsArray.find( el => el.hostname == message)
        if (result) {
            sendResponse([result, flags[(result.countryName).slice(-3,-1)]]);
        }
    });

    // Добавляем слушателя на обновление вкладок
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        // Проверяем, что обновление завершено и вкладка активна
        if (changeInfo.status === 'complete' && tab.active) {
            const url = new URL(tab.url); // Создаем объект URL для получения хостнейма
            const hostname = url.hostname; // Извлекаем хостнейм из URL
            const result = await getFlagImage(hostname)
            chrome.action.setIcon({ path: "data:image/png;base64," + result.flagImg, tabId: tab.id })
            chrome.action.setTitle({ title: `Сервер сайта находится в \n${result.countryName}`, tabId: tab.id })
            console.log("result ", result, "hostname ", hostname)
            tabsArray.push({
                tabId: tab.id,
                hostname,
                flagImg: result.flagImg,
                ips: result.ips
            })
        }
    });

    // Выводим текущий список вкладок и их флагов в консоль
    console.log(tabsArray);
}

// Добавляем слушателя на изменение активной вкладки
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // Ищем вкладку в массиве по её ID
    const tab = tabsArray.find(el => el.tabId === activeInfo.tabId);
    if (tab) {
        console.log("Есть в массиве вкладок", tab.tabId)
        console.log("tabsArray ", tabsArray)
    } else {
        // Если вкладка не найдена, выводим сообщение в консоль
        console.log('Ещё нет в списке', activeInfo.tabId);
        console.log("activeInfo ",activeInfo)
    }
});

// Функция для получения изображения флага по хостнейму и данным флагов
async function getFlagImage(hostname) {
    // Специальный случай для хостнейма "extensions"
    if (hostname === "extensions") {
        return {
            countryName: "браузер Chrome",
            flagImg: 'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAMxJREFUKFNjZCARMGJT/8bINIHhHwODyIXTC9DlUTS8NTL/j80A4XMn4ergDFyKQQaATBGBaoJrWHHe9b9r8icGNndXBl6zYrBF/93LGBj+rAWzGfnegdWCieVnnRIYmZjn2xd9ZZDM24riqv/OylD+vyRGvg/zwRqWnXeOZ2JgAnsw4sEqXBoSGfk+LEBxEkilnIAjg9WFTKiTShgY/qzHdBJIBOQH9BAKVz4LF0LxA0wUWRM2xXBPo5u84qJLXLjiGSaQm/FGHDGpBACwJkMN0HyvrgAAAABJRU5ErkJggg=='
        };
    }

    if (hostname === "") {
        return {
            countryName: "операционная система Windows",
            flagImg: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAYAAAA7KqwyAAAAAXNSR0IArs4c6QAAAXRJREFUKFNj/PPnz38GJPD27VtkLoOwsDAKH12e8f///3ADQMyXL18ywIS+fPnCoKKiwsDIyAg2BF0eJAY2QGT1PYY3oUpgBbxLbzHcduZjSEtJYpg1Zx6DpKQkg6+3J8PmrdsZbvMJMXBdvwwyieGrpi4D761rDIwgLzAzM8NtePHiBQP/CSmGjxbPwGIgA0AGX3synUFLJhPFhWAXIBvw/ft3hhfPnzNwcHIy/Pj+nYHt91WGXW9iGCKNXzKws7MzvH/3nuHX719wL4IMBnthzZ4jDLlvxRjuC2gzXOA7zCCvIM9w/tw5hta2JobsvjMMJgLXGNTU1RlO19UyXJm3iEFRXZnhh4gwg/6ESRADYMH8ZQUjwxeH53Ab+I5IMSyTZGRItfkH9+LE/SwM4ZpP4DGDEQuf5rIwsMrwMPx58Znhq/tTBhEREYbZx9kZ3r7UZOASusEQrf0UbgE4DP79+4cSja9fv0ZRIC4uDrcN5Fh0eQCCJcxMnIse7gAAAABJRU5ErkJggg=='
        };
    }

    try {
        // Получаем IP-адрес для хостнейма
        const ipResponse = await fetch(`https://linux-academy.ru/what-is-country/${hostname}`);
        const ipData = await ipResponse.json();
        if(ipData){
            return ipData
        }
    } catch (error) {
        // В случае ошибки при получении информации о стране
        console.log('Ошибка при получении страны:', error);
        return {
            countryName: 'Error',
            flagImg: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAYAAAA7KqwyAAAAAXNSR0IArs4c6QAAAXRJREFUKFNj/PPnz38GJPD27VtkLoOwsDAKH12e8f///3ADQMyXL18ywIS+fPnCoKKiwsDIyAg2BF0eJAY2QGT1PYY3oUpgBbxLbzHcduZjSEtJYpg1Zx6DpKQkg6+3J8PmrdsZbvMJMXBdvwwyieGrpi4D761rDIwgLzAzM8NtePHiBQP/CSmGjxbPwGIgA0AGX3synUFLJhPFhWAXIBvw/ft3hhfPnzNwcHIy/Pj+nYHt91WGXW9iGCKNXzKws7MzvH/3nuHX719wL4IMBnthzZ4jDLlvxRjuC2gzXOA7zCCvIM9w/tw5hta2JobsvjMMJgLXGNTU1RlO19UyXJm3iEFRXZnhh4gwg/6ESRADYMH8ZQUjwxeH53Ab+I5IMSyTZGRItfkH9+LE/SwM4ZpP4DGDEQuf5rIwsMrwMPx58Znhq/tTBhEREYbZx9kZ3r7UZOASusEQrf0UbgE4DP79+4cSja9fv0ZRIC4uDrcN5Fh0eQCCJcxMnIse7gAAAABJRU5ErkJggg=='
        };
    }
}

// Инициализируем расширение при запуске
initExt();
