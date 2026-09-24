const authTabs = document.querySelectorAll('.auth-tab');
const authPanels = document.querySelectorAll('.auth-panel');
const authStatus = document.querySelector('#auth-status');
const accountSection = document.querySelector('#account');
const logoutButton = document.querySelector('#logout-button');
const protectedLinks = document.querySelectorAll('.nav-links a:not([href="#account"])');
const protectedSections = document.querySelectorAll('main > section:not(.hero):not(#account)');
const accountStorageKey = 'galaxy-account';
const playerNameStorageKey = 'galaxy-player-name';
const coinStorageKey = 'galaxy-coins';
const inventoryStorageKey = 'galaxy-inventory';
const avatarStorageKey = 'galaxy-avatar';
const playedGamesStorageKey = 'galaxy-played-games';
const completedMissionsStorageKey = 'galaxy-missions';
const demoAccount = {
    name: 'Galaxy Guest',
    email: 'guest@galaxy.com',
    password: 'galaxy123'
};

const getStoredAccount = () => {
    try {
        const account = JSON.parse(localStorage.getItem(accountStorageKey) || 'null');
        if (!account || typeof account.name !== 'string' || typeof account.email !== 'string' || typeof account.password !== 'string') {
            localStorage.removeItem(accountStorageKey);
            return null;
        }
        if (!account.playerName || typeof account.playerName !== 'string') {
            account.playerName = account.name;
            localStorage.setItem(accountStorageKey, JSON.stringify(account));
        }
        return account;
    } catch {
        localStorage.removeItem(accountStorageKey);
        return null;
    }
};

const getDisplayName = (account) => (account?.playerName || account?.name || 'Player').trim();

const setAuthStatus = (message, isError = false) => {
    if (!authStatus) return;
    authStatus.textContent = message;
    authStatus.dataset.state = isError ? 'error' : 'success';
};

const getAuthenticatedAccount = (email, password) => {
    const storedAccount = getStoredAccount();
    if (storedAccount && storedAccount.email === email && storedAccount.password === password) {
        return storedAccount;
    }

    if (email === demoAccount.email && password === demoAccount.password) {
        return demoAccount;
    }

    return null;
};

const getPlayedGames = () => {
    try {
        return JSON.parse(localStorage.getItem(playedGamesStorageKey) || '[]');
    } catch {
        return [];
    }
};

const getCompletedMissions = () => {
    try {
        return JSON.parse(localStorage.getItem(completedMissionsStorageKey) || '[]');
    } catch {
        return [];
    }
};

const updateMissionButtons = () => {
    const playedGames = new Set(getPlayedGames());
    const completedMissions = new Set(getCompletedMissions());
    const isAuthenticated = document.body.classList.contains('authenticated');

    document.querySelectorAll('.quest-button').forEach((button) => {
        const game = button.dataset.game;
        const isClaimed = completedMissions.has(game);
        const isUnlocked = isAuthenticated && playedGames.has(game) && !isClaimed;

        button.disabled = !isUnlocked;
        button.textContent = isClaimed
            ? 'Claimed'
            : isUnlocked
                ? `Claim ${button.dataset.reward} coins`
                : 'Play game to unlock';
    });
};

const unlockSite = (message, account = null) => {
    document.body.classList.add('authenticated');
    document.body.classList.remove('auth-locked');
    const playerName = getDisplayName(account || getStoredAccount() || demoAccount);
    sessionStorage.setItem('galaxy-authenticated', 'true');
    sessionStorage.setItem(playerNameStorageKey, playerName);
    setAuthStatus(message || `Welcome, ${playerName}. You are connected to the website.`);
    updateMissionButtons();
};

logoutButton?.addEventListener('click', () => {
    document.body.classList.remove('authenticated');
    document.body.classList.add('auth-locked');
    sessionStorage.removeItem('galaxy-authenticated');
    sessionStorage.removeItem(playerNameStorageKey);
    setAuthStatus('You have been logged out. Sign up or log in to continue.');
    updateMissionButtons();
    showAuthTab(document.querySelector('#login-tab') || authTabs[0]);
    accountSection?.scrollIntoView({ behavior: 'smooth' });
});

updateMissionButtons();

const showAuthTab = (tab) => {
    const panelId = tab.getAttribute('aria-controls');

    authTabs.forEach((currentTab) => {
        const isActive = currentTab === tab;
        currentTab.classList.toggle('active', isActive);
        currentTab.setAttribute('aria-selected', String(isActive));
    });

    authPanels.forEach((panel) => {
        panel.hidden = panel.id !== panelId;
    });
};

authTabs.forEach((tab) => {
    tab.addEventListener('click', () => showAuthTab(tab));
});

protectedSections.forEach((section) => section.classList.add('protected-section'));

protectedLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        if (document.body.classList.contains('authenticated')) return;
        event.preventDefault();
        setAuthStatus('Please sign up or log in before accessing this area.', true);
        accountSection?.scrollIntoView({ behavior: 'smooth' });
    });
});

document.querySelector('#signup-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.querySelector('#full-name')?.value.trim();
    const playerName = form.querySelector('#player-name')?.value.trim();
    const email = form.querySelector('#signup-email')?.value.trim().toLowerCase();
    const password = form.querySelector('#signup-password')?.value;

    if (!name || !playerName || !email || !password) {
        setAuthStatus('Please complete every sign-up field, including your player name.', true);
        return;
    }

    if (password.length < 6) {
        setAuthStatus('Your password must be at least 6 characters.', true);
        return;
    }

    const account = { name, playerName, email, password };
    localStorage.setItem(accountStorageKey, JSON.stringify(account));
    form.reset();
    unlockSite(`Account created for ${playerName}. You are connected to Galaxy.`, account);
});

document.querySelector('#login-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.querySelector('#login-email')?.value.trim().toLowerCase();
    const password = form.querySelector('#login-password')?.value;

    if (!email || !password) {
        setAuthStatus('Please enter both your email and password.', true);
        return;
    }

    const account = getAuthenticatedAccount(email, password);
    if (!account) {
        setAuthStatus('The email or password is incorrect. Try the demo login: guest@galaxy.com / galaxy123', true);
        showAuthTab(document.querySelector('#signup-tab') || authTabs[0]);
        return;
    }

    const savedAccount = getStoredAccount();
    if (!savedAccount) {
        localStorage.setItem(accountStorageKey, JSON.stringify({
            name: account.name,
            playerName: account.playerName || account.name,
            email: account.email,
            password: account.password
        }));
    }

    form.reset();
    unlockSite(`Welcome back, ${getDisplayName(account)}. You are logged in.`, account);
});

if (sessionStorage.getItem('galaxy-authenticated') === 'true') {
    const account = getStoredAccount();
    if (account) {
        unlockSite(`Welcome back, ${getDisplayName(account)}. You are logged in.`, account);
    } else {
        sessionStorage.removeItem('galaxy-authenticated');
        sessionStorage.removeItem(playerNameStorageKey);
    }
}

document.querySelector('#newsletter-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#newsletter-status');
    if (status) status.textContent = 'Thanks! You are subscribed to Galaxy updates.';
    event.currentTarget.reset();
});

document.querySelector('#chat-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.querySelector('#chat-input');
    const messages = document.querySelector('#chat-messages');
    const message = input?.value.trim();
    if (!message || !messages) return;

    const userMessage = document.createElement('p');
    userMessage.textContent = `You: ${message}`;
    messages.appendChild(userMessage);

    const reply = document.createElement('p');
    reply.textContent = 'Alexander: Thanks for your message! I will help you with Galaxy Gaming information.';
    messages.appendChild(reply);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
});

const coinBalance = document.querySelector('#coin-balance');
let coins = Number.parseInt(localStorage.getItem(coinStorageKey) || coinBalance?.textContent || '0', 10);
if (!Number.isFinite(coins)) coins = 0;
const renderCoins = () => {
    if (coinBalance) coinBalance.textContent = String(coins);
    localStorage.setItem(coinStorageKey, String(coins));
};
renderCoins();

document.querySelectorAll('.quest-button').forEach((button) => {
    button.addEventListener('click', () => {
        if (button.disabled) return;
        const reward = Number.parseInt(button.dataset.reward || '0', 10);
        const game = button.dataset.game;
        const completedMissions = getCompletedMissions();
        if (!completedMissions.includes(game)) {
            completedMissions.push(game);
            localStorage.setItem(completedMissionsStorageKey, JSON.stringify(completedMissions));
        }
        coins += reward;
        button.disabled = true;
        button.textContent = 'Claimed';
        renderCoins();
        const status = document.querySelector('#quest-status');
        if (status) status.textContent = `${game} mission claimed. +${reward} coins added.`;
        updateMissionButtons();
    });
});

const gameLinks = document.querySelectorAll('.game-link');
gameLinks.forEach((link) => {
    link.addEventListener('click', () => {
        const game = link.dataset.game;
        if (!game) return;
        const playedGames = getPlayedGames();
        if (!playedGames.includes(game)) {
            playedGames.push(game);
            localStorage.setItem(playedGamesStorageKey, JSON.stringify(playedGames));
        }
        updateMissionButtons();
    });
});

const inventoryList = document.querySelector('#inventory-list');
const inventory = JSON.parse(localStorage.getItem(inventoryStorageKey) || '[]');
const gameUrls = {
    Fortnite: 'https://www.fortnite.com/',
    Valorant: 'https://playvalorant.com/',
    Minecraft: 'https://www.minecraft.net/',
    PUBG: 'https://pubg.com/',
    FIFA: 'https://www.ea.com/games/ea-sports-fc',
    'Genshin Impact': 'https://genshin.hoyoverse.com/',
    'Wuthering Waves': 'https://wutheringwaves.kurogames.com/',
};
const renderInventory = () => {
    if (!inventoryList) return;
    inventoryList.replaceChildren();
    if (!inventory.length) {
        inventoryList.textContent = 'Your collection is empty.';
        return;
    }
    inventory.forEach(({ item, game }) => {
        const entry = document.createElement('span');
        entry.className = 'inventory-entry';
        entry.textContent = `${game}: ${item}`;
        inventoryList.append(entry);
        const url = gameUrls[game];
        if (url) {
            const link = document.createElement('a');
            link.className = 'inventory-link';
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Open game';
            inventoryList.append(link);
        }
        inventoryList.append(' | ');
    });
    inventoryList.lastChild?.remove();
};
renderInventory();

document.querySelectorAll('.store-buy').forEach((button) => {
    button.addEventListener('click', () => {
        const price = Number.parseInt(button.dataset.price || '0', 10);
        const item = button.dataset.item || 'Item';
        const game = button.dataset.game || 'Galaxy';
        const status = document.querySelector('#store-status');
        if (coins < price) {
            if (status) status.textContent = `You need ${price - coins} more coins to buy ${item}.`;
            return;
        }
        coins -= price;
        inventory.push({ item, game });
        localStorage.setItem(inventoryStorageKey, JSON.stringify(inventory));
        button.disabled = true;
        button.textContent = 'Owned';
        renderCoins();
        renderInventory();
        if (status) status.textContent = `${item} added to your collection.`;
    });
});

const avatarForm = document.querySelector('#avatar-form');
let avatarData = null;
try {
    avatarData = JSON.parse(localStorage.getItem(avatarStorageKey) || 'null');
} catch {
    localStorage.removeItem(avatarStorageKey);
}
const avatarUsername = document.querySelector('#avatar-name-input');
const defaultAvatarUsername = sessionStorage.getItem(playerNameStorageKey) || getDisplayName(getStoredAccount() || demoAccount);
if (avatarUsername && !avatarData?.name) avatarUsername.value = defaultAvatarUsername;
const avatarOptions = {
    skin: { sunrise: '#f6c7a2', honey: '#c98b5b', cocoa: '#7b4b35', moon: '#ead8d0' },
    hair: { nebula: 'hair-nebula', flare: 'hair-flare', comet: 'hair-comet', visor: 'hair-visor' },
    outfit: { neon: 'outfit-neon', royal: 'outfit-royal', cyber: 'outfit-cyber', cosmic: 'outfit-cosmic' },
    accessory: { none: '', crown: 'accessory-crown', headset: 'accessory-headset', visor: 'accessory-visor' },
    background: { aurora: '', sunset: 'backdrop-sunset', ocean: 'backdrop-ocean', royal: 'backdrop-royal' },
};
const applyAvatar = (data) => {
    const preview = document.querySelector('#avatar-preview');
    const name = document.querySelector('#avatar-name');
    const head = document.querySelector('#avatar-head');
    const hair = document.querySelector('#avatar-hair-preview');
    const body = document.querySelector('#avatar-body');
    const accessory = document.querySelector('#avatar-accessory-preview');
    if (!preview || !name || !head || !hair || !body || !accessory) return;
    name.textContent = data.name || 'Galaxy Player';
    head.style.backgroundColor = avatarOptions.skin[data.skin] || avatarOptions.skin.sunrise;
    hair.className = `avatar-hair ${avatarOptions.hair[data.hair] || avatarOptions.hair.nebula}`;
    body.className = `avatar-body ${avatarOptions.outfit[data.outfit] || avatarOptions.outfit.neon}`;
    accessory.className = `avatar-accessory ${avatarOptions.accessory[data.accessory] || ''}`;
    preview.className = `avatar-preview ${avatarOptions.background[data.background] || ''}`;
};
if (avatarData) {
    Object.entries(avatarData).forEach(([key, value]) => {
        const field = document.querySelector(`#avatar-${key}-input, #avatar-${key}`);
        if (field) field.value = value;
    });
    applyAvatar(avatarData);
} else {
    applyAvatar({
        name: defaultAvatarUsername,
        skin: 'sunrise',
        hair: 'nebula',
        outfit: 'neon',
        accessory: 'none',
        background: 'ocean',
    });
}
const readAvatarForm = () => ({
    name: document.querySelector('#avatar-name-input')?.value.trim() || defaultAvatarUsername,
    skin: document.querySelector('#avatar-skin')?.value || 'sunrise',
    hair: document.querySelector('#avatar-hair')?.value || 'nebula',
    outfit: document.querySelector('#avatar-outfit')?.value || 'neon',
    accessory: document.querySelector('#avatar-accessory')?.value || 'none',
    background: document.querySelector('#avatar-background')?.value || 'aurora',
});

avatarForm?.querySelectorAll('input, select').forEach((field) => {
    field.addEventListener('input', () => applyAvatar(readAvatarForm()));
    field.addEventListener('change', () => applyAvatar(readAvatarForm()));
});

avatarForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = readAvatarForm();
    localStorage.setItem(avatarStorageKey, JSON.stringify(data));
    applyAvatar(data);
    const status = document.querySelector('#avatar-form-status');
    if (status) status.textContent = 'Avatar saved to your Galaxy profile.';
});

document.querySelector('#gamer-chat-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.querySelector('#gamer-name')?.value.trim();
    const message = form.querySelector('#gamer-message')?.value.trim();
    const messages = document.querySelector('#gamer-messages');
    if (!name || !message || !messages) return;
    const post = document.createElement('p');
    post.innerHTML = `<strong>${name.replace(/[<>&"']/g, '')}:</strong> ${message.replace(/[<>&"']/g, '')}`;
    messages.append(post);
    form.reset();
    messages.scrollTop = messages.scrollHeight;
});
