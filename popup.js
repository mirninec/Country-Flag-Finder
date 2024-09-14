// Событие 'DOMContentLoaded' срабатывает, когда HTML-документ полностью загружен и разобран.
/** 
 * @brief Выполняет скрипт после полной загрузки страницы.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Получаем ссылки на элементы DOM, где будет отображена информация о стране и флаге.
    const countryNameElement = document.getElementById('countryName');  ///< Элемент для отображения названия страны.
    const countryFlagElement = document.getElementById('countryFlag');  ///< Элемент для отображения флага страны.
    const test = document.getElementById('test');  ///< Элемент для тестового вывода IP-адресов.

    // Получаем текущую активную вкладку браузера.
    /**
     * @brief Запрашивает информацию о текущей активной вкладке и отправляет сообщение в background.js для получения данных о стране и флаге.
     * @param {Object[]} tabs Массив вкладок, активных в текущем окне.
     */
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        const activeTab = tabs[0];  ///< Первая (и единственная активная) вкладка.
        const url = new URL(activeTab.url);  ///< Создаем объект URL для извлечения хостнейма из активной вкладки.
        const hostname = url.hostname;  ///< Извлекаем хостнейм (доменное имя) из URL активной вкладки.

        // Создаем соединение с background.js через порт.
        const port = chrome.runtime.connect({ name: "popup" });

        // Отправляем сообщение background.js для запроса данных по хостнейму.
        /**
         * @brief Отправляет запрос на получение данных по хостнейму активной вкладки.
         * @param {string} action Действие "getData", указывающее background.js, что нужно вернуть данные.
         * @param {string} hostname Хостнейм активной вкладки, для которого требуется информация.
         */
        port.postMessage({ action: "getData", hostname: hostname });

        // Слушаем ответ от background.js через порт.
        /**
         * @brief Обрабатывает ответ от background.js, содержащий данные о стране и флаге.
         * @param {Object} msg Сообщение, полученное от background.js, содержащее данные о стране, флаге и IP-адресах.
         */
        port.onMessage.addListener(async (msg) => {
            // Обновляем содержимое элементов DOM с полученной информацией.
            countryNameElement.textContent = await msg.data.countryName;  ///< Устанавливаем название страны в элемент.
            countryFlagElement.src = `data:image/png;base64,${msg.data.bigFlagImg}`;  ///< Устанавливаем изображение флага (base64) в элемент.
            test.textContent = await msg.data.ips;  ///< Отображаем IP-адреса в тестовом элементе.
        });

    });
});
