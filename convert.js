const fs = require('fs');

// Динамический импорт для node-fetch
async function fetchFlagAsBase64(countryCode, size) {
    const { default: fetch } = await import('node-fetch'); // Импортируем fetch

    const url = `https://flagcdn.com/${size}/${countryCode.toLowerCase()}.png`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Не удалось получить флаг для ${countryCode}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
}

// Основная функция для преобразования данных
async function convertFlagsData() {
    const flagsData = JSON.parse(fs.readFileSync('flags.json', 'utf-8'));
    const convertedData = {};

    for (const [code, name] of Object.entries(flagsData)) {
        try {
            const smallFlagImg = await fetchFlagAsBase64(code, '16x12');
            const bigFlagImg = await fetchFlagAsBase64(code, '64x48');
            convertedData[code] = {
                "name": `${name} (${code})`,
                "flagImg": smallFlagImg,
                "bigFlagImg": bigFlagImg
            };
            console.log(`Успешно обработан флаг для: ${name} (${code})`);
        } catch (error) {
            console.error(`Ошибка при обработке ${name} (${code}):`, error);
        }
    }

    // Запись преобразованных данных в новый файл
    fs.writeFileSync('convertedFlags.json', JSON.stringify(convertedData, null, 2), 'utf-8');
    console.log('Данные успешно преобразованы и сохранены в convertedFlags.json');
}

// Запуск программы
convertFlagsData().catch(error => {
    console.error('Ошибка в процессе преобразования:', error);
});
