import { compBase64String, osWindowsImg, brauserChromeImg } from './utils.js';

// Массив для хранения информации о вкладках и их флагах
/** @brief Массив, содержащий объекты с информацией о каждой вкладке, включая флаг страны. */
let tabsArray = [];

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
    tabsArray = await Promise.all(tabs.map(async tab => {

        const url = new URL(tab.url); // Создаем объект URL для извлечения хостнейма.
        const hostname = url.hostname; // Извлекаем хостнейм из URL.

        // Получаем изображение флага и информацию о стране по хостнейму.
        const result = await getFlagImage(hostname);

        // Устанавливаем иконку флага и название страны для текущей вкладки.
        chrome.action.setIcon({ path: "data:image/png;base64," + result.flagImg, tabId: tab.id });
        chrome.action.setTitle({ title: `Сервер сайта находится в \n${result.countryName}`, tabId: tab.id });

        // Возвращаем объект с информацией о вкладке и флаге.
        return {
            tabId: tab.id,
            hostname,
            flagImg: result.flagImg,
            ips: result.ips,
            countryName: result.countryName
        };
    }));

    // Добавляем слушателя на обновление вкладок.
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        // Проверяем, что обновление вкладки завершено и она активна.
        if (changeInfo.status === 'complete' && tab.active) {
            const url = new URL(tab.url); // Создаем объект URL для извлечения хостнейма.
            const hostname = url.hostname; // Извлекаем хостнейм из URL.

            // Получаем изображение флага и информацию о стране по хостнейму.
            const result = await getFlagImage(hostname);

            // Обновляем иконку и название для обновленной вкладки.
            chrome.action.setIcon({ path: "data:image/png;base64," + result.flagImg, tabId: tab.id });
            chrome.action.setTitle({ title: `Сервер сайта находится в \n${result.countryName}`, tabId: tab.id });

            // Добавляем информацию о вкладке в массив.
            tabsArray.push({
                tabId: tab.id,
                hostname,
                flagImg: result.flagImg,
                ips: result.ips
            });
        }
    });

    // Выводим текущий массив вкладок и их флагов в консоль.
    console.log(tabsArray);
}

// Добавляем слушателя на изменение активной вкладки.
/**
 * @brief Обрабатывает изменение активной вкладки и выводит информацию о ней в консоль.
 * @param {Object} activeInfo Информация об активной вкладке (ID и индекс).
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // Ищем вкладку в массиве по её ID.
    const tab = tabsArray.find(el => el.tabId === activeInfo.tabId);

    // Если вкладка найдена, выводим её данные.
    if (tab) {
        console.log("Есть в массиве вкладок", tab.tabId);
        console.log("tabsArray ", tabsArray);
    } else {
        // Если вкладка не найдена, выводим сообщение об отсутствии.
        console.log('Ещё нет в списке', activeInfo.tabId);
        console.log("activeInfo ", activeInfo);
    }
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
            flagImg: brauserChromeImg
        };
    }

    if (hostname === "") {
        return {
            countryName: "операционная система Windows",
            flagImg: osWindowsImg
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

/**
 * @brief Слушатель сообщений от popup.js для получения информации о текущей вкладке.
 * @param {Object} port Соединение с другим скриптом (popup.js).
 */
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "popup") {
        port.onMessage.addListener(async (msg) => {
            if (msg.action === "getData") {
                // Обрабатываем специальные случаи для локального хостнейма.
                if (msg.hostname === "extensions" || msg.hostname === "") {
                    let tab = {
                        ips: "компьютер",
                        countryName: "локальный",
                        bigFlagImg: compBase64String
                    };
                    port.postMessage({ data: tab });
                } else {
                    // Ищем информацию о вкладке по хостнейму.
                    let tab = await tabsArray.find(el => el.hostname === msg.hostname);
                    const shortContryName = await (tab.countryName).slice(-3, -1);
                    const dataFlags = await flags;
                    let bigFlagImg = await dataFlags[shortContryName].bigFlagImg;
                    tab = { ...tab, bigFlagImg };
                    console.log("tab ", tab);
                    port.postMessage({ data: tab });
                }
            }
        });
    }
});

// Инициализируем расширение при запуске.
initExt();
