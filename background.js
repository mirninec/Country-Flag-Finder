console.log("init");

// Массив для хранения информации о вкладках и их флагах
const tabsArray = [];

// Основная функция инициализации расширения
async function initExt() {
    console.log("Вызвана функция initExt()");

    // Загружаем данные флагов из файла 'convertedFlags.json'
    const flagsData = await loadFlagsData();

    // Получаем список всех вкладок
    const tabs = await new Promise((resolve) => {
        chrome.tabs.query({}, (result) => resolve(result));
    });

    // Проходим по каждой вкладке и собираем данные о флаге
    for (let tab of tabs) {
        const url = new URL(tab.url); // Создаем объект URL для получения хостнейма
        const hostname = url.hostname; // Извлекаем хостнейм из URL
        const flagImg = await getFlagImage(hostname, flagsData); // Получаем изображение флага для хостнейма
        tabsArray.push({
            id: tab.id, // ID вкладки
            hostname, // Хостнейм
            flagImg // Данные изображения флага
        });
    }

    // Добавляем слушателя на обновление вкладок
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        // Проверяем, что обновление завершено и вкладка активна
        if (changeInfo.status === 'complete' && tab.active) {
            const url = new URL(tab.url); // Создаем объект URL для получения хостнейма
            const hostname = url.hostname; // Извлекаем хостнейм из URL
            const flagImg = await getFlagImage(hostname, flagsData); // Получаем изображение флага для хостнейма
            chrome.action.setIcon({ path: { "16": flagImg.flag }, tabId }); // Устанавливаем иконку расширения для вкладки
            chrome.action.setTitle({ title: `Сервер сайта находится в ${flagImg.countryName}`, tabId }); // Устанавливаем заголовок иконки
            tabsArray.push({
                id: tabId, // ID вкладки
                hostname, // Хостнейм
                flagImg // Данные изображения флага
            });
        }
    });

    // Выводим текущий список вкладок и их флагов в консоль
    console.log(tabsArray);
}

// Добавляем слушателя на изменение активной вкладки
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // Ищем вкладку в массиве по её ID
    const tab = tabsArray.find(el => el.id === activeInfo.tabId);
    if (tab) {
        // Если вкладка найдена, устанавливаем иконку и заголовок
        chrome.action.setIcon({ path: { "16": tab.flagImg.flag }, tabId: activeInfo.tabId });
        chrome.action.setTitle({ title: `Сервер сайта находится в ${tab.flagImg.countryName}`, tabId: activeInfo.tabId });
    } else {
        // Если вкладка не найдена, выводим сообщение в консоль
        console.log('Ещё нет в списке', activeInfo.tabId);
    }
    // Выводим данные о найденной вкладке в консоль
    console.log("tab", tab);
});

// Функция для получения изображения флага по хостнейму и данным флагов
async function getFlagImage(hostname, flagsData) {
    // Специальный случай для хостнейма "extensions"
    if (hostname === "extensions") {
        return {
            countryName: "браузер Chrome",
            flag: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAMxJREFUKFNjZCARMGJT/8bINIHhHwODyIXTC9DlUTS8NTL/j80A4XMn4ergDFyKQQaATBGBaoJrWHHe9b9r8icGNndXBl6zYrBF/93LGBj+rAWzGfnegdWCieVnnRIYmZjn2xd9ZZDM24riqv/OylD+vyRGvg/zwRqWnXeOZ2JgAnsw4sEqXBoSGfk+LEBxEkilnIAjg9WFTKiTShgY/qzHdBJIBOQH9BAKVz4LF0LxA0wUWRM2xXBPo5u84qJLXLjiGSaQm/FGHDGpBACwJkMN0HyvrgAAAABJRU5ErkJggg=='
        };
    }

    try {
        // Получаем IP-адрес для хостнейма
        const ipResponse = await fetch(`https://dnsjson.com/${hostname}/A.json`);
        const ipData = await ipResponse.json();
        const ip = ipData.results.records[0]; // Берем первый IP из ответа

        // Получаем информацию о стране по IP-адресу
        const countryResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        const countryData = await countryResponse.json();
        const countryCode = countryData.country_code;
        const countryName = countryData.country_name;

        if (countryCode && countryName) {
            // Находим данные флага для страны
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
        // В случае ошибки при получении информации о стране
        console.error('Ошибка при получении страны:', error);
        return {
            countryName: 'Error',
            flag: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAJCAYAAAA7KqwyAAAAAXNSR0IArs4c6QAAAXRJREFUKFNj/PPnz38GJPD27VtkLoOwsDAKH12e8f///3ADQMyXL18ywIS+fPnCoKKiwsDIyAg2BF0eJAY2QGT1PYY3oUpgBbxLbzHcduZjSEtJYpg1Zx6DpKQkg6+3J8PmrdsZbvMJMXBdvwwyieGrpi4D761rDIwgLzAzM8NtePHiBQP/CSmGjxbPwGIgA0AGX3synUFLJhPFhWAXIBvw/ft3hhfPnzNwcHIy/Pj+nYHt91WGXW9iGCKNXzKws7MzvH/3nuHX719wL4IMBnthzZ4jDLlvxRjuC2gzXOA7zCCvIM9w/tw5hta2JobsvjMMJgLXGNTU1RlO19UyXJm3iEFRXZnhh4gwg/6ESRADYMH8ZQUjwxeH53Ab+I5IMSyTZGRItfkH9+LE/SwM4ZpP4DGDEQuf5rIwsMrwMPx58Znhq/tTBhEREYbZx9kZ3r7UZOASusEQrf0UbgE4DP79+4cSja9fv0ZRIC4uDrcN5Fh0eQCCJcxMnIse7gAAAABJRU5ErkJggg=='
        };
    }
}

// Функция для загрузки данных флагов из файла 'convertedFlags.json'
async function loadFlagsData() {
    const response = await fetch(chrome.runtime.getURL('convertedFlags.json'));
    return response.json();
}

// Инициализируем расширение при запуске
initExt();

/*

1. **`console.log("init"); `**
   - Логирует сообщение в консоль при запуске скрипта. Это помогает понять, что скрипт был загружен.

2. **`const tabsArray = []; `**
   - Создает пустой массив для хранения информации о вкладках и соответствующих флагах.

3. **`async function initExt() {
    `**
   - Основная асинхронная функция, которая выполняет инициализацию расширения.

4. **`console.log("Вызвана функция initExt()"); `**
   - Логирует сообщение, когда функция `initExt` вызывается, для отладки.

5. **`const flagsData = await loadFlagsData(); `**
   - Загружает данные флагов из JSON-файла с помощью функции `loadFlagsData`. Использует `await `, потому что функция `loadFlagsData` возвращает промис.

6. **`const tabs = await new Promise((resolve) => { chrome.tabs.query({}, (result) => resolve(result)); }); `**
   - Запрашивает список всех открытых вкладок. Использует промис для преобразования асинхронного вызова `chrome.tabs.query` в более удобный синтаксис `await `.

7. **`for (let tab of tabs) {
        `**
   - Перебирает каждую вкладку в массиве `tabs`.

8. **`const url = new URL(tab.url); `**
   - Создает объект URL из строки URL вкладки, чтобы легко извлекать компоненты URL, такие как хостнейм.

9. **`const hostname = url.hostname; `**
   - Извлекает хостнейм из URL.

10. **`const flagImg = await getFlagImage(hostname, flagsData); `**
    - Получает изображение флага для текущего хостнейма, используя функцию `getFlagImage`.

11. **`tabsArray.push({ id: tab.id, hostname, flagImg }); `**
    - Добавляет информацию о вкладке и флаге в массив `tabsArray`.

12. **`chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
            `**
    - Добавляет слушателя для событий обновления вкладок. Функция вызывается, когда вкладка обновляется.

13. **`if (changeInfo.status === 'complete' && tab.active) {
                `**
    - Проверяет, завершено ли обновление вкладки и активна ли она.

14. **`const url = new URL(tab.url); `**
    - Создает объект URL из обновленного URL вкладки.

15. **`const hostname = url.hostname; `**
    - Извлекает хостнейм из URL.

16. **`const flagImg = await getFlagImage(hostname, flagsData); `**
    - Получает изображение флага для обновленного хостнейма.

17. **`chrome.action.setIcon({ path: { "16": flagImg.flag }, tabId }); `**
    - Устанавливает иконку для расширения в активной вкладке, используя изображение флага.

18. **`chrome.action.setTitle({ title: `Сервер сайта находится в ${flagImg.countryName}`, tabId }); `**
    - Устанавливает заголовок иконки для вкладки.

19. **`tabsArray.push({ id: tabId, hostname, flagImg }); `**
    - Добавляет обновленную вкладку и флаг в массив `tabsArray`.

20. **`console.log(tabsArray); `**
    - Выводит массив `tabsArray` в консоль для отладки.

21. **`chrome.tabs.onActivated.addListener(async (activeInfo) => {
                    `**
    - Добавляет слушателя для событий активации вкладок. Функция вызывается, когда вкладка становится активной.

22. **`const tab = tabsArray.find(el => el.id === activeInfo.tabId); `**
    - Ищет информацию о вкладке в массиве `tabsArray` по ID активной вкладки.

23. **`if (tab) {
                        `**
    - Если вкладка найдена в массиве.

24. **`chrome.action.setIcon({ path: { "16": tab.flagImg.flag }, tabId: activeInfo.tabId }); `**
    - Устанавливает иконку для расширения в активной вкладке.

25. **`chrome.action.setTitle({ title: `Сервер сайта находится в ${tab.flagImg.countryName}`, tabId: activeInfo.tabId }); `**
    - Устанавливает заголовок иконки для активной вкладки.

26. **`console.log('Ещё нет в списке', activeInfo.tabId); `**
    - Выводит сообщение в консоль, если вкладка не найдена в массиве `tabsArray`.

27. **`console.log("tab", tab); `**
    - Выводит информацию о найденной вкладке в консоль.

28. **`async function getFlagImage(hostname, flagsData) {
                            `**
    - Асинхронная функция для получения изображения флага по хостнейму.

29. **`if (hostname === "extensions") {
                                `**
    - Специальный случай для хостнейма `extensions`.

30. **`return { countryName: "браузер Chrome", flag: 'data:image/png;base64,...' }; `**
    - Возвращает флаг для хостнейма `extensions`.

31. **`try { ... } catch (error) { ... } `**
    - Блок `try...catch` для обработки ошибок при получении информации о флаге.

32. **`const ipResponse = await fetch(...); `**
    - Запрашивает IP-адрес для хостнейма.

33. **`const countryResponse = await fetch(...); `**
    - Запрашивает информацию о стране по IP-адресу.

34. **`return { countryName, flag: `data:image/png;base64,${flagData.bigFlagImg}` }; `**
    - Возвращает данные о флаге для найденной страны.

35. **`return { countryName: 'Country not found', flag: 'data:image/png;base64,...' }; `**
    - Возвращает данные о флаге по умолчанию, если страна не найдена.

36. **`return { countryName: 'Error', flag: 'data:image/png;base64,...' }; `**
    - Возвращает данные о флаге с пометкой об ошибке, если произошла ошибка при запросах.

37. **`async function loadFlagsData() {
        `**
    - Асинхронная функция для загрузки данных флагов из JSON-файла.

38. **`const response = await fetch(chrome.runtime.getURL('convertedFlags.json')); `**
    - Запрашивает файл `convertedFlags.json` из корня расширения.

39. **`return response.json(); `**
    - Возвращает данные

 из JSON-файла.

40. **`initExt(); `**
    - Вызывает функцию `initExt` для запуска и инициализации расширения при загрузке скрипта.

*/