

/**
 * @brief Загружает данные о флагах из локального файла JSON.
 * @return {Promise<Object>} Возвращает объект с данными о флагах.
 */
async function loadFlagsData() {
    const response = await fetch(chrome.runtime.getURL('convertedFlags.json'));
    return response.json();
}

const flags = loadFlagsData();  ///< Промис, который будет разрешен с данными флагов.

/**
 * @brief Обновляет иконку и название вкладки, а также сохраняет данные в chrome.storage.
 * @param {Object} tab Объект вкладки.
 * @param {Object} result Результат функции getFlagImage с информацией о флаге и стране.
 */
async function updateTabInfo(tab, result) {
    // Устанавливаем иконку флага и название страны для текущей вкладки.
    chrome.action.setIcon({ path: "data:image/png;base64," + result.flagImg, tabId: tab.id });
    chrome.action.setTitle({ title: `Сервер сайта находится в \n${result.countryName}`, tabId: tab.id });

    const shortCountryName = result.countryName.slice(-3, -1);
    const dataFlags = await flags;
    let bigFlagImg;
    if (dataFlags[shortCountryName]) {
        bigFlagImg = dataFlags[shortCountryName].bigFlagImg;
    }

    const idString = tab.id.toString();
    const data = {
        hostname: new URL(tab.url).hostname,
        flagImg: result.flagImg,
        bigFlagImg,
        ips: result.ips,
        countryName: result.countryName
    };

    const dataToStore = {
        [idString]: data
    };

    chrome.storage.local.set(dataToStore, () => {
        console.log("Сохранено: ", dataToStore);
    });
}

/**
 * @brief Инициализация расширения.
 * 
 * Получает список всех открытых вкладок, собирает информацию о сервере (страна, флаг), 
 * устанавливает иконки и названия для каждой вкладки, а также добавляет слушатели на обновление и активацию вкладок.
 */
async function initExt() {

    /**
     * @brief Получение всех открытых вкладок браузера.
     * @return {Promise<Array>} Возвращает массив объектов вкладок.
     */
    const tabs = await new Promise((resolve) => {
        chrome.tabs.query({}, (result) => resolve(result));
    });

    // Обрабатываем каждую вкладку для сбора информации о сервере и флаге.
    tabs.map(async tab => {
        const result = await getFlagImage(new URL(tab.url).hostname);
        await updateTabInfo(tab, result);
    });

    chrome.storage.local.get(null, function (items) {
        // Получаем все ключи
        const allKeys = Object.keys(items);

        // Выводим ключи в консоль
        console.log('Все ключи в chrome.storage.local:', allKeys);
    });
}

// Добавляем слушателя на обновление вкладок.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const idString = tabId.toString();

    chrome.storage.local.get([idString], async function (result) {
        if (changeInfo.status === 'complete' && tab.active) {
            const hostname = new URL(tab.url).hostname;
            const flagData = await getFlagImage(hostname);
            await updateTabInfo(tab, flagData);
        }
    });
});

// Добавляем слушателя на изменение активной вкладки.
/**
 * @brief Обрабатывает изменение активной вкладки и выводит информацию о ней в консоль.
 * @param {Object} activeInfo Информация об активной вкладке (ID и индекс).
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const id = activeInfo.tabId.toString();

    chrome.storage.local.get([id], function (result) {
        if (result) {
            console.log(`Вкладка ${id} есть в chrome.storage.local`);
        } else {
            console.log(`Вкладки ${id} ещё нет в chrome.storage.local`);
        }
    });
});

/**
 * @brief Получает изображение флага и название страны по хостнейму.
 * @param {string} hostname Хостнейм сайта.
 * @return {Promise<Object>} Возвращает объект с изображением флага и названием страны.
 */
async function getFlagImage(hostname) {
    // Обрабатываем специальные случаи для браузера и операционной системы.
    if (hostname === "extensions") {
        return {
            countryName: "браузер Chrome",
            flagImg: brauserChromeImg,
            bigFlagImg: compBase64String
        };
    }

    if (hostname === "") {
        return {
            countryName: "операционная система Windows",
            flagImg: osWindowsImg,
            bigFlagImg: compBase64String
        };
    }

    if (hostname === "newtab" || hostname === "history") {
        return {
            countryName: "операционная система Windows",
            flagImg: compBase64String,
            bigFlagImg: compBase64String
        };
    }

    try {
        // Запрашиваем IP-адрес и информацию о стране для данного хостнейма.
        const ipResponse = await fetch(`https://linux-academy.ru/what-is-country/${hostname}`);
        const ipData = await ipResponse.json();

        // Возвращаем данные о стране и флаге.
        if (ipData) {
            return ipData;
        }
    } catch (error) {
        // Обрабатываем ошибку получения данных о стране.
        console.log('Ошибка при получении страны:', error);
        return {
            countryName: 'Error',
            flagImg: osWindowsImg
        };
    }
}

chrome.tabs.onRemoved.addListener(function (tabId) {
    const id = tabId.toString();

    chrome.storage.local.remove([id], function () {
        console.log(`Вкладка ${id} была удалена из chrome.storage.local`);
    });
});

// Инициализируем расширение при запуске.
initExt();



const brauserChromeImg = "iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAMxJREFUKFNjZCARMGJT/8bINIHhHwODyIXTC9DlUTS8NTL/j80A4XMn4ergDFyKQQaATBGBaoJrWHHe9b9r8icGNndXBl6zYrBF/93LGBj+rAWzGfnegdWCieVnnRIYmZjn2xd9ZZDM24riqv/OylD+vyRGvg/zwRqWnXeOZ2JgAnsw4sEqXBoSGfk+LEBxEkilnIAjg9WFTKiTShgY/qzHdBJIBOQH9BAKVz4LF0LxA0wUWRM2xXBPo5u84qJLXLjiGSaQm/FGHDGpBACwJkMN0HyvrgAAAABJRU5ErkJggg=="

const osWindowsImg =
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAYAAAA7KqwyAAAAAXNSR0IArs4c6QAAAXRJREFUKFNj/PPnz38GJPD27VtkLoOwsDAKH12e8f///3ADQMyXL18ywIS+fPnCoKKiwsDIyAg2BF0eJAY2QGT1PYY3oUpgBbxLbzHcduZjSEtJYpg1Zx6DpKQkg6+3J8PmrdsZbvMJMXBdvwwyieGrpi4D761rDIwgLzAzM8NtePHiBQP/CSmGjxbPwGIgA0AGX3synUFLJhPFhWAXIBvw/ft3hhfPnzNwcHIy/Pj+nYHt91WGXW9iGCKNXzKws7MzvH/3nuHX719wL4IMBnthzZ4jDLlvxRjuC2gzXOA7zCCvIM9w/tw5hta2JobsvjMMJgLXGNTU1RlO19UyXJm3iEFRXZnhh4gwg/6ESRADYMH8ZQUjwxeH53Ab+I5IMSyTZGRItfkH9+LE/SwM4ZpP4DGDEQuf5rIwsMrwMPx58Znhq/tTBhEREYbZx9kZ3r7UZOASusEQrf0UbgE4DP79+4cSja9fv0ZRIC4uDrcN5Fh0eQCCJcxMnIse7gAAAABJRU5ErkJggg=='

const compBase64String = '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'
