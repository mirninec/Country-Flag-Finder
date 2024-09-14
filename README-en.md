# Country Flag Finder

![Country Flag Finder Icon](icon.png)

## Description

**Country Flag Finder** is a Google Chrome browser extension that allows you to determine the country where the server of the displayed website is located and shows the corresponding flag in the address bar.

For the extension to work correctly, it requires the address of a server that processes requests at `/what-is-country/[website host]`. The code for such a server for self-hosting can be found [here](https://github.com/mirninec/unix-server.git).

### Key Features:

- Detects the country where the server of the website in the active tab is located.
- Displays the server’s country flag in the browser's address bar.
- Information about the server’s country, IP addresses, and a large image of the flag is available through the extension's popup.

## Installation

### Install via Chrome Web Store

Unavailable at the time of publication.

### Local Installation

1. Download the repository to your computer:
    ```bash
    git clone https://github.com/mirninec/Country-Flag-Finder.git
    ```

2. Open the Chrome browser and go to `chrome://extensions/`.

3. Enable **Developer mode** (in the top right corner of the page).

4. Click **Load unpacked extension** and select the folder with the downloaded repository.

5. The extension will be installed and ready for use.

## Usage

1. Open any website in the active browser tab.
2. The extension icon with the server's country flag will appear in the address bar.
3. Hover over the flag icon to see the country name.
4. For more detailed information, click the flag icon to open the popup, which displays the server’s information.

## Development

### Main Project Files:

- **background.js** — the background script that handles data retrieval about the website and sets the flag icon.
- **popup.html** — the popup that shows detailed information about the server and the country.
- **manifest.json** — the configuration file for the extension.
- **convertedFlags.json** — a JSON file containing data about flags for different countries.

### Permissions:

The extension uses the following permissions:
- **activeTab** — access to the active tab to retrieve the website's URL.
- **tabs** — access to all tabs to monitor page updates.
- **host_permissions** — access to any website to determine its IP addresses and countries.

### Contributing

We welcome contributions to the project. If you would like to contribute:

1. Fork the repository.
2. Create a new branch:
    ```bash
    git checkout -b feature/my-feature
    ```
3. Make your changes and commit them:
    ```bash
    git commit -am 'Add new feature'
    ```
4. Push the changes to GitHub:
    ```bash
    git push origin feature/my-feature
    ```
5. Create a Pull Request on GitHub.

## License

This project is licensed under the MIT License.
