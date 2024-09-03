document.addEventListener('DOMContentLoaded', async () => {
    const countryNameElement = document.getElementById('countryName');
    const countryFlagElement = document.getElementById('countryFlag');
    const test = document.getElementById('test');

    // Загружаем данные флагов из файла convertedFlags.json
    async function loadFlagsData() {
        const response = await fetch(chrome.runtime.getURL('convertedFlags.json'));
        return response.json();
    }

    // Получаем текущую активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        const activeTab = tabs[0];
        const url = new URL(activeTab.url);
        const hostname = url.hostname;

        try {
            const ip = await fetch(`https://dnsjson.com/${hostname}/A.json`)
                .then(response => response.json())
                .then(data => {
                    return data["results"]["records"];
                });

            test.textContent = ip;

            const response = await fetch(`https://ipapi.co/${ip[0]}/json/`);
            const data = await response.json();
            const countryCode = data.country_code;
            const countryName = data.country_name;

            if (countryCode && countryName) {
                // Загружаем данные флагов
                const flagsData = await loadFlagsData();

                // Получаем изображение флага из данных
                const flagData = flagsData[countryCode.toUpperCase()];
                if (flagData && flagData.bigFlagImg) {
                    countryNameElement.textContent = countryName;
                    countryFlagElement.src = `data:image/png;base64,${flagData.bigFlagImg}`;
                    chrome.action.setIcon({ path: `data:image/png;base64,${flagData.flagImg}`, tabId: activeTab.id });
                    chrome.action.setTitle({ title: `Сервер сайта находится в ${countryName}`, tabId: activeTab.id });
                } else {
                    countryNameElement.textContent = 'Flag not found';
                }
            } else {
                countryNameElement.textContent = 'Country not found';
            }
        } catch (error) {
            countryNameElement.textContent = 'Error loading country';
            console.error('Ошибка при получении страны:', error);
        }
    });
});
