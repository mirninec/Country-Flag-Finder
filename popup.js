document.addEventListener('DOMContentLoaded', async () => {
    const countryNameElement = document.getElementById('countryName');
    const countryFlagElement = document.getElementById('countryFlag');
    const test = document.getElementById('test');

    // Получаем текущую активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        const activeTab = tabs[0];
        const url = new URL(activeTab.url);
        const hostname = url.hostname;

        chrome.runtime.sendMessage(hostname, async (response) => {
            if(response){
                countryNameElement.textContent = response[0].countryName
                countryFlagElement.src = `data:image/png;base64,${response[1].bigFlagImg}`;
                test.textContent = response[0].ips
            }
        });

    });
});
