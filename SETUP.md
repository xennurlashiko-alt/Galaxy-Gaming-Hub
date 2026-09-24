# Galaxy Gaming Hub setup

This folder currently contains the website files. The API connection needs a backend server before the API keys can be used.

## API key file

1. Make a copy of `.env.example` in this folder.
2. Rename the copy to `.env`.
3. Put your real keys after the `=` signs.
4. Keep `.env` private. It is already listed in `.gitignore`.

The website cannot use these keys directly from `Index.html`. A backend server must read them and call each game's official API.

## Current website

Open `index.html` in a browser to use the static website. The game buttons can open official websites or supported launchers, but real player data and verified missions require the backend/API integration.

## Optional Windows desktop launcher

Install Node.js from https://nodejs.org/, then open PowerShell in the `desktop-launcher` folder and run:

```powershell
npm install
npm start
```

This opens Galaxy Hub as a Windows app and forwards installed-game links to supported launchers. The games and launchers must still be installed and logged in.