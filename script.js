const authTabs = document.querySelectorAll('.auth-tab');
const authPanels = document.querySelectorAll('.auth-panel');
const authStatus = document.querySelector('#auth-status');
const accountSection = document.querySelector('#account');
const logoutButton = document.querySelector('#logout-button');
const headerShortcuts = document.querySelectorAll('.header-shortcut');
const accountStorageKey = 'galaxy-account';
const accountsStorageKey = 'galaxy-accounts';
const activeAccountEmailKey = 'galaxy-active-account';
const playerNameStorageKey = 'galaxy-player-name';
const coinStorageKey = 'galaxy-coins';
const inventoryStorageKey = 'galaxy-inventory';
const avatarStorageKey = 'galaxy-avatar';
const playedGamesStorageKey = 'galaxy-played-games';
const completedMissionsStorageKey = 'galaxy-missions';
const xpStorageKey = 'galaxy-xp';
const levelStorageKey = 'galaxy-level';
const dailyMissionStorageKey = 'galaxy-daily-mission-date';
const dailyRewardStorageKey = 'galaxy-daily-reward-date';
const demoAccount = {
    name: 'Galaxy Guest',
    email: 'guest@galaxy.com',
    password: 'galaxy123'
};

const isValidAccount = (account) => account
    && typeof account.name === 'string'
    && typeof account.email === 'string'
    && typeof account.password === 'string';

const normalizeAccount = (account) => ({
    name: account.name.trim(),
    playerName: typeof account.playerName === 'string' && account.playerName.trim()
        ? account.playerName.trim()
        : account.name.trim(),
    email: account.email.trim().toLowerCase(),
    password: account.password
});

const getStoredAccounts = () => {
    let accounts = [];
    try {
        const savedAccounts = JSON.parse(localStorage.getItem(accountsStorageKey) || '[]');
        if (Array.isArray(savedAccounts)) {
            accounts = savedAccounts.filter(isValidAccount).map(normalizeAccount);
        }
    } catch {
        accounts = [];
    }

    let legacyAccount = null;
    try {
        legacyAccount = JSON.parse(localStorage.getItem(accountStorageKey) || 'null');
    } catch {
        localStorage.removeItem(accountStorageKey);
    }

    if (isValidAccount(legacyAccount)) {
        const normalizedLegacy = normalizeAccount(legacyAccount);
        if (!accounts.some((account) => account.email === normalizedLegacy.email)) {
            accounts.push(normalizedLegacy);
        }
        localStorage.setItem(accountsStorageKey, JSON.stringify(accounts));
        localStorage.removeItem(accountStorageKey);
    }

    return accounts;
};

const getAccountByEmail = (email) => getStoredAccounts()
    .find((account) => account.email === email) || null;

const getStoredAccount = () => {
    const activeEmail = sessionStorage.getItem(activeAccountEmailKey);
    if (activeEmail === demoAccount.email) return demoAccount;
    if (activeEmail) return getAccountByEmail(activeEmail);
    return getStoredAccounts()[0] || null;
};

const saveAccount = (account) => {
    const accounts = getStoredAccounts();
    if (accounts.some((storedAccount) => storedAccount.email === account.email)) return false;

    try {
        accounts.push(account);
        localStorage.setItem(accountsStorageKey, JSON.stringify(accounts));
        return true;
    } catch {
        return false;
    }
};

const getDisplayName = (account) => (account?.playerName || account?.name || 'Player').trim();

const setAuthStatus = (message, isError = false) => {
    if (!authStatus) return;
    authStatus.textContent = message;
    authStatus.dataset.state = isError ? 'error' : 'success';
};

const getAccountsByIdentifier = (identifier) => {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const accounts = getStoredAccounts();
    const emailMatch = accounts.find((account) => account.email === normalizedIdentifier);
    return emailMatch
        ? [emailMatch]
        : accounts.filter((account) => account.playerName.toLowerCase() === normalizedIdentifier);
};

const getAccountByIdentifier = (identifier) => getAccountsByIdentifier(identifier)[0] || null;

const getAuthenticatedAccount = (identifier, password) => {
    const matchingAccount = getAccountsByIdentifier(identifier)
        .find((account) => account.password === password);
    if (matchingAccount) return matchingAccount;

    if (identifier.trim().toLowerCase() === demoAccount.email && password === demoAccount.password) {
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

const updateHeaderShortcuts = () => {
    const isAuthenticated = document.body.classList.contains('authenticated');
    headerShortcuts.forEach((shortcut) => {
        shortcut.href = isAuthenticated ? shortcut.dataset.target : '#account';
        shortcut.setAttribute('aria-disabled', String(!isAuthenticated));
        const status = shortcut.querySelector('.header-shortcut-status');
        if (status) status.textContent = isAuthenticated ? 'Open' : 'Sign in first to unlock';
        const balance = shortcut.querySelector('.header-shortcut-balance');
        if (balance) balance.hidden = !isAuthenticated;
    });
};

const unlockSite = (message, account = null) => {
    document.body.classList.add('authenticated');
    document.body.classList.remove('auth-locked');
    window.scrollTo(0, 0);
    const authenticatedAccount = account || getStoredAccount() || demoAccount;
    const playerName = getDisplayName(authenticatedAccount);
    sessionStorage.setItem('galaxy-authenticated', 'true');
    sessionStorage.setItem(activeAccountEmailKey, authenticatedAccount.email);
    sessionStorage.setItem(playerNameStorageKey, playerName);
    setAuthStatus(message || `Welcome, ${playerName}. You are connected to the website.`);
    updateMissionButtons();
    updateHeaderShortcuts();
};

logoutButton?.addEventListener('click', () => {
    document.body.classList.remove('authenticated');
    document.body.classList.add('auth-locked');
    sessionStorage.removeItem('galaxy-authenticated');
    sessionStorage.removeItem(activeAccountEmailKey);
    sessionStorage.removeItem(playerNameStorageKey);
    setAuthStatus('You have been logged out. Sign in to save your profile and claim rewards.');
    updateMissionButtons();
    updateHeaderShortcuts();
    showAuthTab(document.querySelector('#login-tab') || authTabs[0]);
    accountSection?.scrollIntoView({ behavior: 'smooth' });
});

updateMissionButtons();
updateHeaderShortcuts();

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

if (authTabs.length) showAuthTab(authTabs[0]);

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

    if (email === demoAccount.email) {
        setAuthStatus('That email is reserved for the demo account. Please use another email.', true);
        return;
    }

    if (getAccountByEmail(email)) {
        setAuthStatus('An account with that email already exists. Log in instead.', true);
        showAuthTab(document.querySelector('#login-tab'));
        return;
    }

    const account = { name, playerName, email, password };
    if (!saveAccount(account)) {
        setAuthStatus('Your account could not be saved in this browser. Check storage settings and try again.', true);
        return;
    }
    form.reset();
    unlockSite(`Account created for ${playerName}. You are connected to Galaxy.`, account);
});

document.querySelector('#login-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const identifier = form.querySelector('#login-identifier')?.value.trim();
    const password = form.querySelector('#login-password')?.value;

    if (!identifier || !password) {
        setAuthStatus('Please enter your email or player name and password.', true);
        return;
    }

    const account = getAuthenticatedAccount(identifier, password);
    if (!account) {
        const accountExists = getAccountByIdentifier(identifier);
        const isDemoLogin = identifier.trim().toLowerCase() === demoAccount.email;
        setAuthStatus(accountExists || isDemoLogin
            ? 'The password is incorrect. Please try again.'
            : 'No account with that email or player name is saved in this browser. Sign up here or use the browser where you registered.', true);
        return;
    }

    form.reset();
    unlockSite(`Welcome back, ${getDisplayName(account)}. You are logged in.`, account);
});

if (sessionStorage.getItem('galaxy-authenticated') === 'true') {
    const activeEmail = sessionStorage.getItem(activeAccountEmailKey);
    const account = activeEmail === demoAccount.email
        ? demoAccount
        : activeEmail
            ? getAccountByEmail(activeEmail)
            : getStoredAccount();
    if (account) {
        unlockSite(`Welcome back, ${getDisplayName(account)}. You are logged in.`, account);
    } else {
        sessionStorage.removeItem('galaxy-authenticated');
        sessionStorage.removeItem(activeAccountEmailKey);
        sessionStorage.removeItem(playerNameStorageKey);
    }
}

document.querySelector('#newsletter-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('#newsletter-status');
    if (status) status.textContent = 'Thanks! You are subscribed to Galaxy updates.';
    event.currentTarget.reset();
});

const getAlexanderFaqReply = (message) => {
    const question = message.toLowerCase();

    if (/\b(hi|hello|hey)\b/.test(question)) {
        return 'Hey! Tell me what kind of game you enjoy, or ask me for a game recommendation, a tip, or help with Galaxy features.';
    }
    if (/recommend|suggest|what should i play|what game|bored/.test(question)) {
        if (/competitive|ranked|pvp/.test(question)) {
            return 'For competitive play, try Valorant for tactical rounds, Fortnite for fast building and battles, or PUBG for a more survival-focused match.';
        }
        if (/relax|creative|build/.test(question)) {
            return 'For a creative or relaxed session, try Minecraft. If you want exploration and character progression, try Genshin Impact or Wuthering Waves.';
        }
        if (/story|adventure|explor/.test(question)) {
            return 'For an adventure, try Genshin Impact, Wuthering Waves, Honkai: Star Rail, or Zenless Zone Zero. Pick the world or combat style that sounds most fun to you.';
        }
        return 'What sounds fun right now: competitive matches (Valorant, Fortnite, or PUBG), building (Minecraft), sports (EA SPORTS FC), or an adventure (Genshin Impact or Honkai: Star Rail)?';
    }
    if (/tip|improve|strategy|practice|aim/.test(question)) {
        if (/valorant|fortnite|pubg/.test(question)) {
            return 'Try one focused goal per session: warm up your aim, review one mistake after each match, and practice a single map or landing route before changing strategies.';
        }
        if (/minecraft/.test(question)) {
            return 'Minecraft tip: set one small goal for each session, such as gathering supplies, building a safe base, or exploring one nearby area.';
        }
        return 'A useful practice loop: choose one skill to work on, play a short session with that goal, then note one thing to try differently next time. Which game do you want tips for?';
    }
    if (/teammate|team up|find friends|play with friends|community chat/.test(question)) {
        return 'Open Gamer Chat to introduce yourself, share which game you play, and look for teammates. Avoid posting passwords or personal contact details.';
    }
    if (/store|shop|inventory|item/.test(question)) {
        return 'Browse the Store section to see available items, then check Inventory for items you have collected. Some purchases or payment features may need the site backend to be configured.';
    }
    if (/not opening|won.t open|doesn.t open|launch error|launcher blocked/.test(question)) {
        return 'Make sure the game and its launcher are installed. If your browser blocks app launching, start the hub with python game_launcher.py, then try Open Game again.';
    }
    if (/what can you do|how can you help|help me/.test(question)) {
        return 'I can recommend games, share practice ideas, explain missions and coins, help with avatars and accounts, and point you to events or Gamer Chat.';
    }
    if (/payment|checkout|gcash|maya|card|pay/.test(question)) {
        return 'You can choose GCash, Maya, or card at checkout. Secure payments are not available until the site payment server is configured.';
    }
    if (/mission|reward|coin/.test(question)) {
        return 'Sign in to unlock mission rewards. Play a listed game first, then return to claim its coins.';
    }
    if (/avatar|profile/.test(question)) {
        return 'Open Avatar Studio to change your name, appearance, and backdrop, then select Save Avatar.';
    }
    if (/game|play|launcher/.test(question)) {
        return 'Choose a game in Games Available to launch its installed game app. The game and its launcher must be installed on this computer.';
    }
    if (/event|tournament/.test(question)) {
        return 'The events listed here are a Valorant tournament on Saturdays and a Mobile Legends tournament on Sundays.';
    }
    if (/hour|open|location|address/.test(question)) {
        return 'The website does not list opening hours or a physical address yet. Please contact the Galaxy Gaming Hub team for those details.';
    }
    if (/account|login|log in|sign up|password/.test(question)) {
        return 'Use the Account section to create a profile or log in. You can browse the site without signing in; an account is needed for rewards.';
    }

    return 'I can help with games, missions, coins, your avatar, events, and checkout. What would you like to know?';
};

const getAlexanderReply = async (message) => {
    if (window.location.protocol === 'file:') return getAlexanderFaqReply(message);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        if (!response.ok) return getAlexanderFaqReply(message);
        const data = await response.json();
        return typeof data.reply === 'string' && data.reply.trim()
            ? data.reply.trim()
            : getAlexanderFaqReply(message);
    } catch {
        return getAlexanderFaqReply(message);
    }
};

document.querySelector('#chat-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.querySelector('#chat-input');
    const messages = document.querySelector('#chat-messages');
    const status = document.querySelector('#chat-status');
    const submitButton = form.querySelector('button[type="submit"]');
    const message = input?.value.trim();
    if (!message || !input || !messages || !submitButton) return;

    const appendMessage = (speaker, text) => {
        const paragraph = document.createElement('p');
        const label = document.createElement('strong');
        label.textContent = `${speaker}:`;
        paragraph.append(label, ` ${text}`);
        messages.appendChild(paragraph);
    };

    appendMessage('You', message);
    input.value = '';
    input.disabled = true;
    submitButton.disabled = true;
    if (status) status.textContent = 'Alexander is thinking...';

    const reply = await getAlexanderReply(message);
    appendMessage('Alexander', reply);
    if (status) status.textContent = '';
    input.disabled = false;
    submitButton.disabled = false;
    input.focus();
    messages.scrollTop = messages.scrollHeight;
});

document.querySelectorAll('.chat-prompt').forEach((button) => {
    button.addEventListener('click', () => {
        const input = document.querySelector('#chat-input');
        const form = document.querySelector('#chat-form');
        if (!input || !form || input.disabled) return;
        input.value = button.dataset.prompt || '';
        form.requestSubmit();
    });
});

const coinBalance = document.querySelector('#coin-balance');
const dashboardCoinBalance = document.querySelector('#coins');
let coins = Number.parseInt(localStorage.getItem(coinStorageKey) || coinBalance?.textContent || '0', 10);
if (!Number.isFinite(coins)) coins = 0;
const renderCoins = () => {
    if (coinBalance) coinBalance.textContent = String(coins);
    if (dashboardCoinBalance) dashboardCoinBalance.textContent = String(coins);
    localStorage.setItem(coinStorageKey, String(coins));
};
renderCoins();

const xpDisplay = document.querySelector('#xp');
const levelDisplay = document.querySelector('#level');
const dashboardStatus = document.querySelector('#dashboard-status');
const completeMissionButton = document.querySelector('#complete-mission-button');
const dailyRewardButton = document.querySelector('#daily-reward-button');
let experience = Number.parseInt(localStorage.getItem(xpStorageKey) || xpDisplay?.textContent || '0', 10);
let playerLevel = Number.parseInt(localStorage.getItem(levelStorageKey) || levelDisplay?.textContent || '1', 10);
if (!Number.isFinite(experience) || experience < 0) experience = 0;
if (!Number.isFinite(playerLevel) || playerLevel < 1) playerLevel = 1;

const getLocalDateKey = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const renderDashboardStats = () => {
    if (xpDisplay) xpDisplay.textContent = String(experience);
    if (levelDisplay) levelDisplay.textContent = String(playerLevel);
    if (completeMissionButton) {
        const claimed = localStorage.getItem(dailyMissionStorageKey) === getLocalDateKey();
        completeMissionButton.disabled = claimed;
        completeMissionButton.textContent = claimed ? 'Mission Complete Today' : 'Complete Mission';
    }
    if (dailyRewardButton) {
        const claimed = localStorage.getItem(dailyRewardStorageKey) === getLocalDateKey();
        dailyRewardButton.disabled = claimed;
        dailyRewardButton.textContent = claimed ? 'Reward Claimed Today' : 'Daily Reward';
    }
};

const addExperience = (amount) => {
    experience += amount;
    while (experience >= playerLevel * 100) {
        experience -= playerLevel * 100;
        playerLevel += 1;
    }
    localStorage.setItem(xpStorageKey, String(experience));
    localStorage.setItem(levelStorageKey, String(playerLevel));
    renderDashboardStats();
};

completeMissionButton?.addEventListener('click', () => {
    if (localStorage.getItem(dailyMissionStorageKey) === getLocalDateKey()) return;
    localStorage.setItem(dailyMissionStorageKey, getLocalDateKey());
    addExperience(50);
    if (dashboardStatus) dashboardStatus.textContent = 'Mission complete. You earned 50 XP.';
});

dailyRewardButton?.addEventListener('click', () => {
    if (localStorage.getItem(dailyRewardStorageKey) === getLocalDateKey()) return;
    localStorage.setItem(dailyRewardStorageKey, getLocalDateKey());
    coins += 25;
    renderCoins();
    addExperience(25);
    if (dashboardStatus) dashboardStatus.textContent = 'Daily reward claimed: 25 Galaxy Coins and 25 XP.';
});

renderDashboardStats();

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

document.querySelectorAll('.game-launch-link').forEach((link) => {
    link.addEventListener('click', () => {
        const status = document.querySelector('#launcher-status');
        if (status) status.textContent = `Opening ${link.dataset.game}. If nothing happens, install the official launcher first.`;
    });
});

const inventoryList = document.querySelector('#inventory-list');
const dashboardInventory = document.querySelector('#inventory');
let inventory = [];
try {
    const savedInventory = JSON.parse(localStorage.getItem(inventoryStorageKey) || '[]');
    if (Array.isArray(savedInventory)) {
        inventory = savedInventory.filter((entry) => entry && typeof entry.item === 'string' && typeof entry.game === 'string');
    }
} catch {
    localStorage.removeItem(inventoryStorageKey);
}
const gameIds = {
    Fortnite: 'fortnite',
    Valorant: 'valorant',
    Minecraft: 'minecraft',
    PUBG: 'pubg',
    FIFA: 'fifa',
    'Genshin Impact': 'genshin',
    'Wuthering Waves': 'wuthering-waves',
};
const renderInventory = () => {
    if (inventoryList) {
        inventoryList.replaceChildren();
        if (!inventory.length) {
            inventoryList.textContent = 'Your collection is empty.';
        } else {
            inventory.forEach(({ item, game }, index) => {
                const entry = document.createElement('span');
                entry.className = 'inventory-entry';
                entry.textContent = `${game}: ${item}`;
                inventoryList.append(entry);
                const gameId = gameIds[game];
                if (gameId) {
                    const launchButton = document.createElement('button');
                    launchButton.type = 'button';
                    launchButton.className = 'inventory-link';
                    launchButton.textContent = 'Launch Game';
                    launchButton.addEventListener('click', () => {
                        document.querySelector(`.play-btn[data-game="${gameId}"]`)?.click();
                    });
                    inventoryList.append(launchButton);
                }
                if (index < inventory.length - 1) inventoryList.append(' | ');
            });
        }
    }

    if (dashboardInventory) {
        dashboardInventory.replaceChildren();
        if (!inventory.length) {
            const emptyEntry = document.createElement('li');
            emptyEntry.textContent = 'No items owned yet';
            dashboardInventory.append(emptyEntry);
        } else {
            inventory.forEach(({ item, game }) => {
                const entry = document.createElement('li');
                entry.textContent = `${game}: ${item}`;
                dashboardInventory.append(entry);
            });
        }
    }
};
renderInventory();

document.querySelectorAll('.buy-btn').forEach((button) => {
    const item = button.dataset.item;
    const game = button.dataset.game;
    const price = Number.parseInt(button.dataset.price || '0', 10);
    const storeStatus = document.querySelector('#store-status');
    const isOwned = inventory.some((entry) => entry.item === item && entry.game === game);
    if (isOwned) {
        button.disabled = true;
        button.textContent = 'Owned';
        return;
    }

    button.addEventListener('click', () => {
        if (!Number.isFinite(price) || price <= 0 || !item || !game) {
            if (storeStatus) storeStatus.textContent = 'This item is not available to purchase right now.';
            return;
        }
        if (coins < price) {
            if (storeStatus) storeStatus.textContent = `You need ${price - coins} more coins to buy ${item}.`;
            return;
        }

        inventory.push({ item, game });
        try {
            localStorage.setItem(inventoryStorageKey, JSON.stringify(inventory));
        } catch {
            inventory.pop();
            if (storeStatus) storeStatus.textContent = 'Your item could not be saved in this browser.';
            return;
        }

        coins -= price;
        button.disabled = true;
        button.textContent = 'Owned';
        renderCoins();
        renderInventory();
        if (storeStatus) storeStatus.textContent = `${item} added to your collection for ${price} coins.`;
    });
});

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
const input = document.getElementById("messageInput");
const button = document.getElementById("sendButton");
const chatBox = document.getElementById("chatBox");
const status = document.getElementById("status");

if (input && button && chatBox && status) {
button.addEventListener("click", sendMessage);

input.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        sendMessage();
    }

});
}

async function sendMessage() {

    const message = input.value.trim();

    if (!message) {
        return;
    }

    addMessage("You", message, "user");

    input.value = "";

    status.textContent = "Alexander is thinking...";

    button.disabled = true;

    try {

        const response = await fetch("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })

        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        addMessage(
            "Alexander",
            data.reply,
            "alexander"
        );

    } catch (error) {

        addMessage(
            "Alexander",
            "Sorry, gamer. I couldn't connect right now. Please try again.",
            "alexander"
        );

        console.error(error);

    } finally {

        status.textContent = "";

        button.disabled = false;

        input.focus();
    }
}


function addMessage(name, text, type) {

    const messageDiv = document.createElement("div");

    messageDiv.className = `message ${type}`;

    const nameElement = document.createElement("b");

    nameElement.textContent = name + ":";

    messageDiv.appendChild(nameElement);

    messageDiv.appendChild(
        document.createTextNode(" " + text)
    );

    chatBox.appendChild(messageDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
}
function selectPayment(method) {
    selectedPayment = method;

    document.querySelectorAll(".payment-option").forEach(option => {
        option.classList.remove("selected");
    });

    const selected = document.querySelector(
        `[data-payment="${method}"]`
    );

    if (selected) {
        selected.classList.add("selected");
    }

    document.getElementById("selectedPayment").textContent =
        "Selected: " + method;
}


async function startPayment(productId, productName, amount) {

    if (!selectedPayment) {
        alert("Please select a payment method first.");
        return;
    }

    const progress = document.getElementById("paymentProgress");

    progress.style.display = "block";

    if (window.location.protocol === 'file:') {
        document.getElementById("paymentStatus").textContent =
            "Online checkout needs a configured payment server. See SETUP.md.";
        return;
    }

    document.getElementById("paymentStatus").textContent =
        "Creating your payment...";

    document.getElementById("progressBar").style.width = "25%";

    try {

        // Send order to your backend
        const response = await fetch("/api/create-payment", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                productId: productId,
                productName: productName,
                amount: amount,
                paymentMethod: selectedPayment
            })
        });

        document.getElementById("paymentStatus").textContent =
            "Waiting for payment...";

        document.getElementById("progressBar").style.width = "60%";

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Payment could not be created."
            );
        }

        document.getElementById("paymentStatus").textContent =
            "Opening secure checkout...";

        document.getElementById("progressBar").style.width = "80%";

        // Open the real payment provider checkout
        if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
            return;
        }

        throw new Error("No checkout URL received.");

    } catch (error) {

        document.getElementById("paymentStatus").textContent =
            "Online checkout is unavailable right now. Please try again later.";

        document.getElementById("progressBar").style.width = "0%";
        console.error(error);
    }
}
// ==========================================
// GALAXY GAMING HUB — GAME PLAY BUTTONS
// ==========================================

const games = {
    fortnite: {
        name: 'Fortnite',
        platform: 'Epic Games Launcher',
        protocol: 'com.epicgames.launcher://apps/Fortnite?action=launch&silent=true',
        website: 'https://www.fortnite.com/'
    },

    valorant: {
        name: 'Valorant',
        platform: 'Riot Client',
        protocol: 'valorant://',
        website: 'https://playvalorant.com/'
    },

    minecraft: {
        name: 'Minecraft',
        platform: 'Minecraft Launcher',
        protocol: 'minecraft://',
        website: 'https://www.minecraft.net/'
    },

    pubg: {
        name: 'PUBG',
        platform: 'Steam',
        protocol: 'steam://rungameid/578080',
        website: 'https://pubg.com/'
    },

    fifa: {
        name: 'EA SPORTS FC',
        platform: 'EA app',
        protocol: 'eaapp://',
        website: 'https://www.ea.com/games/ea-sports-fc'
    },

    genshin: {
        name: 'Genshin Impact',
        platform: 'HoYoPlay',
        protocol: 'hoyoplay://',
        website: 'https://genshin.hoyoverse.com/'
    },

    "wuthering-waves": {
        name: 'Wuthering Waves',
        platform: 'Wuthering Waves launcher',
        protocol: 'wutheringwaves://launch',
        website: 'https://wutheringwaves.kurogames.com/en/'
    },

    "honkai-impact-3rd": {
        name: 'Honkai Impact 3rd',
        platform: 'HoYoPlay',
        protocol: 'honkaiimpact3rd://',
        website: 'https://honkaiimpact3.hoyoverse.com/'
    },

    "honkai-star-rail": {
        name: 'Honkai: Star Rail',
        platform: 'HoYoPlay',
        protocol: 'hoyoplay://',
        website: 'https://hsr.hoyoverse.com/'
    },

    "zenless-zone-zero": {
        name: 'Zenless Zone Zero',
        platform: 'HoYoPlay',
        protocol: 'zenless://',
        website: 'https://zenless.hoyoverse.com/'
    }
};


// ==========================================
// PLAY BUTTON SYSTEM
// ==========================================

document.querySelectorAll(".play-btn").forEach(button => {
    const game = games[button.dataset.game];
    if (!game) return;

    button.textContent = 'Launch Game';
    const platformLabel = document.createElement('p');
    platformLabel.className = 'game-platform';
    platformLabel.textContent = game.platform;
    button.before(platformLabel);

    const gameSiteLink = document.createElement('a');
    gameSiteLink.className = 'game-site-link';
    gameSiteLink.href = game.website;
    gameSiteLink.target = '_blank';
    gameSiteLink.rel = 'noopener noreferrer';
    gameSiteLink.textContent = 'Open Game';
    gameSiteLink.setAttribute('aria-label', `Open ${game.name} official website`);
    button.after(gameSiteLink);

    button.addEventListener("click", function () {

        const gameName = this.dataset.game;
        const game = games[gameName];

        if (!game) {
            alert("Game not found.");
            return;
        }

        const launchStatus = document.querySelector('#game-launch-status');
        if (launchStatus) {
            launchStatus.textContent = `Launching ${game.name} through ${game.platform}...`;
        }

        const launchFromDesktopApp = window.location.hostname === '127.0.0.1'
            || window.location.hostname === 'localhost';

        if (launchFromDesktopApp) {
            fetch('/api/launch-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId: gameName })
            }).then((response) => {
                if (!response.ok) throw new Error('Launcher could not open the game.');
                if (launchStatus) {
                    launchStatus.textContent = `Launch request sent to ${game.platform}.`;
                }
            }).catch(() => {
                if (launchStatus) {
                    launchStatus.textContent = `${game.name} could not be launched. Opening its official website...`;
                }
                window.location.assign(game.website);
            });
            return;
        }

        window.location.assign(game.protocol);
    });

});
let selectedPayment = null;
const walletAccountNumber = '09692412575';
const walletNumberInput = document.querySelector('#wallet-number');
const paymentAmountInput = document.querySelector('#payment-amount');
const walletAccountInfo = {
    GCash: `GCash wallet: ${walletAccountNumber}`,
    Maya: `Maya wallet: ${walletAccountNumber}`
};

function getCurrentOrderTotal() {
    return dollCart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function syncPaymentInputs() {
    if (!walletNumberInput) return;

    if ((selectedPayment === 'GCash' || selectedPayment === 'Maya') && !walletNumberInput.value.trim()) {
        walletNumberInput.value = walletAccountNumber;
    }

    if (paymentAmountInput && (!paymentAmountInput.value || Number(paymentAmountInput.value) <= 0)) {
        const orderTotal = getCurrentOrderTotal();
        if (orderTotal > 0) {
            paymentAmountInput.value = String(orderTotal);
        }
    }
}

function selectPayment(method) {
    selectedPayment = method;

    document.querySelectorAll(".payment-option").forEach(option => {
        option.classList.remove("selected");
    });

    const selected = document.querySelector(
        `[data-payment="${method}"]`
    );

    if (selected) {
        selected.classList.add("selected");
    }

    document.getElementById("selectedPayment").textContent =
        "Selected: " + method;
}


async function startPayment(productId, productName, amount) {

    if (!selectedPayment) {
        alert("Please select a payment method first.");
        return;
    }

    const progress = document.getElementById("paymentProgress");

    progress.style.display = "block";

    document.getElementById("paymentStatus").textContent =
        "Creating your payment...";

    document.getElementById("progressBar").style.width = "25%";

    try {

        // Send order to your backend
        const response = await fetch("/api/create-payment", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                productId: productId,
                productName: productName,
                amount: amount,
                paymentMethod: selectedPayment
            })
        });

        document.getElementById("paymentStatus").textContent =
            "Waiting for payment...";

        document.getElementById("progressBar").style.width = "60%";

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Payment could not be created."
            );
        }

        document.getElementById("paymentStatus").textContent =
            "Opening secure checkout...";

        document.getElementById("progressBar").style.width = "80%";

        // Open the real payment provider checkout
        if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
            return;
        }

        throw new Error("No checkout URL received.");

    } catch (error) {

        document.getElementById("paymentStatus").textContent =
            "Secure checkout is unavailable. Configure the payment server before accepting orders.";

        document.getElementById("progressBar").style.width = "0%";

        console.error(error);
    }
}

document.querySelectorAll('.payment-option').forEach((option) => {
    option.addEventListener('click', () => {
        selectedPayment = option.dataset.payment;
        document.querySelectorAll('.payment-option').forEach((currentOption) => {
            const isSelected = currentOption === option;
            currentOption.classList.toggle('selected', isSelected);
            currentOption.setAttribute('aria-pressed', String(isSelected));
        });
        syncPaymentInputs();
        document.querySelector('#selectedPayment').textContent = `${selectedPayment} selected.`;
        const paymentDetails = document.querySelector('#paymentDetails');
        if (paymentDetails) {
            paymentDetails.textContent = selectedPayment === 'GCash'
                ? `GCash wallet number: ${walletNumberInput?.value || walletAccountNumber}. Send the exact order total to this number and confirm the payment after transfer.`
                : selectedPayment === 'Maya'
                    ? `Maya wallet number: ${walletNumberInput?.value || walletAccountNumber}. Send the exact order total to this number and confirm the payment after transfer.`
                    : 'You will be sent to a secure card checkout page to enter your card details.';
        }
        const paymentStatus = document.querySelector('#paymentStatus');
        if (paymentStatus) paymentStatus.textContent = `${selectedPayment} selected.`;
    });
});

document.querySelector('#checkout-button')?.addEventListener('click', () => {
    const progress = document.querySelector('#paymentProgress');
    const status = document.querySelector('#paymentStatus');
    progress.hidden = false;
    progress.style.display = 'block';

    if (!selectedPayment) {
        status.textContent = 'Choose a payment method before continuing.';
        document.querySelector('.payment-option')?.focus();
        return;
    }

    if (!dollCart.length) {
        status.textContent = 'Add at least one merchandise item before checkout.';
        return;
    }

    const walletNumber = walletNumberInput ? walletNumberInput.value.trim() : '';
    const enteredAmount = paymentAmountInput ? Number(paymentAmountInput.value) : NaN;

    if ((selectedPayment === 'GCash' || selectedPayment === 'Maya') && !walletNumber) {
        status.textContent = 'Enter your wallet number to continue.';
        walletNumberInput?.focus();
        return;
    }

    if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
        status.textContent = 'Enter a valid amount before continuing.';
        paymentAmountInput?.focus();
        return;
    }

    const orderName = dollCart.map((item) => `${item.name} x${item.quantity}`).join(', ');
    const orderTotal = enteredAmount;
    const paymentOrderTotal = document.querySelector('#paymentOrderTotal');
    if (paymentOrderTotal) paymentOrderTotal.textContent = pesoFormatter.format(orderTotal);

    if (window.location.protocol === 'file:') {
        status.textContent = `Send ${selectedPayment} payment of ${pesoFormatter.format(orderTotal)} to ${walletNumber || walletAccountNumber}. Once the transfer is sent, confirm the payment in the app or message the seller.`;
        return;
    }

    status.textContent = `Connecting to secure ${selectedPayment} checkout...`;
    startPayment('doll-order', orderName, orderTotal);
});

const dollCartStorageKey = 'galaxy-doll-cart';
const dollCartItems = document.querySelector('#doll-cart-items');
const dollCartCount = document.querySelector('#doll-cart-count');
const dollCartTotal = document.querySelector('#doll-cart-total');
const dollCartEmpty = document.querySelector('#doll-cart-empty');
const dollCartStatus = document.querySelector('#doll-cart-status');
const paymentBagItems = document.querySelector('#payment-bag-items');
const paymentDollItems = document.querySelector('#payment-doll-items');
const pesoFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
});
let dollCart = [];

try {
    const savedDollCart = JSON.parse(localStorage.getItem(dollCartStorageKey) || '[]');
    if (Array.isArray(savedDollCart)) {
        dollCart = savedDollCart.filter((item) =>
            item && typeof item.id === 'string' && typeof item.name === 'string' &&
            Number.isFinite(item.price) && Number.isFinite(item.quantity) && item.quantity > 0
        );
    }
} catch {
    localStorage.removeItem(dollCartStorageKey);
}

const renderDollCart = () => {
    if (!dollCartItems) return;
    dollCartItems.replaceChildren();
    const itemCount = dollCart.reduce((total, item) => total + item.quantity, 0);
    const total = dollCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    dollCartCount.textContent = String(itemCount);
    dollCartTotal.textContent = pesoFormatter.format(total);
    const paymentOrderTotal = document.querySelector('#paymentOrderTotal');
    if (paymentOrderTotal) paymentOrderTotal.textContent = pesoFormatter.format(total);
    const paymentSubtotal = document.querySelector('#payment-subtotal');
    if (paymentSubtotal) paymentSubtotal.textContent = pesoFormatter.format(total);
    const paymentTotal = document.querySelector('#payment-total');
    if (paymentTotal) paymentTotal.textContent = pesoFormatter.format(total);
    dollCartEmpty.hidden = dollCart.length > 0;

    if (paymentBagItems) {
        paymentBagItems.replaceChildren();
        if (!dollCart.length) {
            const emptyRow = document.createElement('li');
            emptyRow.textContent = 'Your bag is empty.';
            paymentBagItems.append(emptyRow);
        } else {
            dollCart.forEach((item) => {
                const row = document.createElement('li');
                row.innerHTML = `<span>${item.name} × ${item.quantity}</span><strong>${pesoFormatter.format(item.price * item.quantity)}</strong>`;
                paymentBagItems.append(row);
            });
        }
    }

    if (paymentDollItems) {
        paymentDollItems.replaceChildren();
        if (!dollCart.length) {
            const emptyRow = document.createElement('li');
            emptyRow.textContent = 'No doll selected.';
            paymentDollItems.append(emptyRow);
        } else {
            dollCart.forEach((item) => {
                const row = document.createElement('li');
                row.textContent = `${item.name} × ${item.quantity}`;
                paymentDollItems.append(row);
            });
        }
    }

    dollCart.forEach((item, index) => {
        const row = document.createElement('li');
        row.className = 'doll-cart-item';
        const details = document.createElement('span');
        details.textContent = `${item.name} × ${item.quantity} · ${pesoFormatter.format(item.price * item.quantity)}`;
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'doll-remove';
        removeButton.textContent = 'Remove';
        removeButton.setAttribute('aria-label', `Remove ${item.name} from bag`);
        removeButton.addEventListener('click', () => {
            dollCart.splice(index, 1);
            saveDollCart();
            renderDollCart();
            dollCartStatus.textContent = `${item.name} removed from your bag.`;
        });
        row.append(details, removeButton);
        dollCartItems.append(row);
    });
};

const saveDollCart = () => {
    try {
        localStorage.setItem(dollCartStorageKey, JSON.stringify(dollCart));
    } catch {
        dollCartStatus.textContent = 'The bag is available for this visit but could not be saved on this device.';
    }
};

const addDollToCart = (item) => {
    const existingItem = dollCart.find((cartItem) => cartItem.id === item.id);
    if (existingItem) existingItem.quantity += 1;
    else dollCart.push({ ...item, quantity: 1 });
    saveDollCart();
    renderDollCart();
    dollCartStatus.textContent = `${item.name} added to your bag.`;
};

document.querySelectorAll('.doll-add').forEach((button) => {
    button.addEventListener('click', () => {
        addDollToCart({
            id: button.dataset.dollId,
            name: button.dataset.dollName,
            price: Number(button.dataset.price)
        });
    });
});

const merchandiseNameInput = document.querySelector('#merch-personalization-name');
document.querySelectorAll('.personal-merch-add').forEach((button) => {
    button.addEventListener('click', () => {
        const personalization = merchandiseNameInput?.value.trim() || 'Galaxy Player';
        const baseName = button.dataset.merchName || 'Galaxy merchandise';
        addDollToCart({
            id: `${button.dataset.merchId}-${personalization.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            name: `${baseName} (${personalization})`,
            price: Number(button.dataset.price)
        });
        if (dollCartStatus) dollCartStatus.textContent = `${baseName} added. Choose a payment method below to finish your order.`;
        document.querySelector('#payments')?.scrollIntoView({ behavior: 'smooth' });
    });
});

const customDollForm = document.querySelector('#doll-custom-form');
const customDollName = document.querySelector('#doll-name');
const customDollPalette = document.querySelector('#doll-palette');
const customDollPreview = document.querySelector('#doll-preview');
const updateCustomDollPreview = () => {
    if (!customDollPreview || !customDollPalette || !customDollName) return;
    customDollPreview.dataset.palette = customDollPalette.value;
    customDollPreview.textContent = `🪆 ${customDollName.value.trim() || 'Your doll'}`;
};
customDollName?.addEventListener('input', updateCustomDollPreview);
customDollPalette?.addEventListener('change', updateCustomDollPreview);
customDollForm?.addEventListener('submit', (event) => {
    if (!customDollName || !customDollPalette) return;
    event.preventDefault();
    const name = customDollName.value.trim();
    const palette = customDollPalette.value;
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    addDollToCart({
        id: `custom-${slug}-${palette}`,
        name: `${name} (custom ${palette} colorway)`,
        price: 999
    });
});
updateCustomDollPreview();
renderDollCart();

const leaderboardStorageKey = 'galaxy-game-leaderboard';
const leaderboardDefaultData = {
    Fortnite: [
        { player: 'NovaByte', score: 39820 },
        { player: 'AstraFox', score: 37340 },
        { player: 'BlinkRush', score: 35610 },
        { player: 'PixelViper', score: 34280 }
    ],
    Valorant: [
        { player: 'EchoZero', score: 2194 },
        { player: 'VantaAim', score: 2105 },
        { player: 'RadiantRose', score: 1988 },
        { player: 'NeonFury', score: 1840 }
    ],
    Minecraft: [
        { player: 'BlockPilot', score: 15840 },
        { player: 'TreeWarden', score: 14970 },
        { player: 'CreeperCard', score: 14220 },
        { player: 'BuildNova', score: 13810 }
    ],
    PUBG: [
        { player: 'StormRanger', score: 18400 },
        { player: 'LastCircle', score: 17610 },
        { player: 'Blackout', score: 16890 },
        { player: 'SafeZone', score: 16240 }
    ],
    'EA SPORTS FC': [
        { player: 'StrikerZero', score: 941 },
        { player: 'MidfieldMagi', score: 903 },
        { player: 'GoalGlass', score: 885 },
        { player: 'TacticTiger', score: 851 }
    ],
    'Genshin Impact': [
        { player: 'LumenKite', score: 12160 },
        { player: 'GeoBloom', score: 11780 },
        { player: 'MoonBloom', score: 11040 },
        { player: 'AetherArc', score: 10580 }
    ],
    'Wuthering Waves': [
        { player: 'SonicDrift', score: 9720 },
        { player: 'EchoNova', score: 9485 },
        { player: 'CometSong', score: 9360 },
        { player: 'WaveBreeze', score: 9204 }
    ],
    'Honkai Impact 3rd': [
        { player: 'VoidWisp', score: 11250 },
        { player: 'StarDrifter', score: 10970 },
        { player: 'RiftMoth', score: 10420 },
        { player: 'CoreBloom', score: 10110 }
    ],
    'Honkai: Star Rail': [
        { player: 'LunaTrail', score: 13680 },
        { player: 'NebulaDeck', score: 12920 },
        { player: 'CosmoReel', score: 12140 },
        { player: 'StarThread', score: 11810 }
    ],
    'Zenless Zone Zero': [
        { player: 'NightRunner', score: 10840 },
        { player: 'ByteBloom', score: 10370 },
        { player: 'CipherLoop', score: 9980 },
        { player: 'PulseLink', score: 9735 }
    ],
    Other: [
        { player: 'ArcPilot', score: 6420 },
        { player: 'PixelHalo', score: 6185 },
        { player: 'DuskMap', score: 5950 },
        { player: 'TurboTide', score: 5710 }
    ]
};

const leaderboardGameSelect = document.querySelector('#leaderboard-game');
const leaderboardRows = document.querySelector('#leaderboard-rows');
const leaderboardEmpty = document.querySelector('#leaderboard-empty');
const leaderboardForm = document.querySelector('#leaderboard-form');
const leaderboardPlayer = document.querySelector('#leaderboard-player');
const leaderboardScore = document.querySelector('#leaderboard-score');
const leaderboardStatus = document.querySelector('#leaderboard-status');

const getLeaderboardData = () => {
    try {
        const savedData = JSON.parse(localStorage.getItem(leaderboardStorageKey) || '{}');
        if (!savedData || typeof savedData !== 'object') return { ...leaderboardDefaultData };

        const merged = { ...leaderboardDefaultData };
        Object.entries(savedData).forEach(([game, entries]) => {
            if (!Array.isArray(entries)) return;
            merged[game] = entries
                .filter((entry) => entry && typeof entry.player === 'string' && Number.isFinite(entry.score))
                .map((entry) => ({
                    player: entry.player.trim(),
                    score: Number(entry.score)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
        });
        return merged;
    } catch {
        return { ...leaderboardDefaultData };
    }
};

const leaderboardData = getLeaderboardData();

const saveLeaderboardData = () => {
    try {
        localStorage.setItem(leaderboardStorageKey, JSON.stringify(leaderboardData));
    } catch {
        if (leaderboardStatus) {
            leaderboardStatus.textContent = 'Leaderboard scores are visible for this visit but could not be saved on this device.';
        }
    }
};

const renderLeaderboard = () => {
    if (!leaderboardGameSelect || !leaderboardRows || !leaderboardEmpty) return;

    const selectedGame = leaderboardGameSelect.value || 'Fortnite';
    const entries = [...(leaderboardData[selectedGame] || [])].sort((a, b) => b.score - a.score);

    leaderboardRows.replaceChildren();
    if (!entries.length) {
        leaderboardEmpty.hidden = false;
        leaderboardStatus.textContent = `No scores for ${selectedGame} yet.`;
        return;
    }

    leaderboardEmpty.hidden = true;
    entries.forEach((entry, index) => {
        const row = document.createElement('tr');
        const rank = document.createElement('td');
        const player = document.createElement('td');
        const score = document.createElement('td');

        rank.textContent = `#${index + 1}`;
        player.textContent = entry.player;
        score.textContent = Number(entry.score).toLocaleString();

        row.append(rank, player, score);
        leaderboardRows.append(row);
    });
};

if (leaderboardGameSelect && leaderboardPlayer) {
    const defaultPlayerName = sessionStorage.getItem(playerNameStorageKey)
        || getDisplayName(getStoredAccount() || demoAccount);
    leaderboardPlayer.value = defaultPlayerName;
    leaderboardGameSelect.addEventListener('change', renderLeaderboard);
}

leaderboardForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!leaderboardGameSelect || !leaderboardPlayer || !leaderboardScore) return;

    const selectedGame = leaderboardGameSelect.value || 'Fortnite';
    const gamerName = leaderboardPlayer.value.trim();
    const scoreValue = Number(leaderboardScore.value);

    if (!gamerName) {
        if (leaderboardStatus) leaderboardStatus.textContent = 'Enter a gamer name before submitting your score.';
        leaderboardPlayer.focus();
        return;
    }

    if (!Number.isFinite(scoreValue) || scoreValue < 0) {
        if (leaderboardStatus) leaderboardStatus.textContent = 'Enter a valid score before submitting.';
        leaderboardScore.focus();
        return;
    }

    const scoreEntry = { player: gamerName, score: Math.round(scoreValue) };
    const gameEntries = leaderboardData[selectedGame] || [];
    leaderboardData[selectedGame] = [...gameEntries, scoreEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    saveLeaderboardData();
    renderLeaderboard();
    leaderboardForm.reset();
    leaderboardPlayer.value = gamerName;
    if (leaderboardStatus) {
        leaderboardStatus.textContent = `${gamerName} is now ranked on the ${selectedGame} leaderboard with ${scoreValue.toLocaleString()} points.`;
    }
});

renderLeaderboard();

document.querySelector('#doll-checkout')?.addEventListener('click', () => {
    if (!dollCart.length) {
        dollCartStatus.textContent = 'Add at least one doll before checkout.';
        return;
    }
    dollCartStatus.textContent = 'Your bag is ready. Choose a payment method below to continue.';
    document.querySelector('#payments')?.scrollIntoView({ behavior: 'smooth' });
});

const highlightStorageKey = 'galaxy-community-highlights';
const highlightFeed = document.querySelector('#highlight-feed');
const highlightEmpty = document.querySelector('#highlight-empty');
const highlightFilter = document.querySelector('#highlight-filter');
const highlightStatus = document.querySelector('#highlight-status');
const communityFriendsStorageKey = 'galaxy-community-friends';
const communityMessagesStorageKey = 'galaxy-community-messages';
const communityFriendList = document.querySelector('#community-friend-list');
const communityFriendCount = document.querySelector('#community-friend-count');
const communityFriendsEmpty = document.querySelector('#community-friends-empty');
const communityDrawer = document.querySelector('#community-drawer');
const communityDrawerOpenButton = document.querySelector('#community-drawer-open');
const communityDrawerCloseButton = document.querySelector('#community-drawer-close');
const communityMessageTo = document.querySelector('#community-message-to');
const communityMessageHistory = document.querySelector('#community-message-history');
const communityMessageEmpty = document.querySelector('#community-message-empty');
const communityMessageForm = document.querySelector('#community-message-form');
const communityMessageInput = document.querySelector('#community-message-input');
const communityMessageStatus = document.querySelector('#community-message-status');
const uploadedHighlightUrls = new Map();
let highlightVideoDatabasePromise;
const getHighlightVideoDatabase = () => {
    if (!window.indexedDB) return Promise.reject(new Error('IndexedDB is unavailable.'));
    if (!highlightVideoDatabasePromise) {
        highlightVideoDatabasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open('galaxy-highlight-videos', 1);
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains('videos')) {
                    request.result.createObjectStore('videos');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    return highlightVideoDatabasePromise;
};
const saveHighlightVideo = async (id, file) => {
    const database = await getHighlightVideoDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction('videos', 'readwrite');
        transaction.objectStore('videos').put(file, id);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
    });
};
const getHighlightVideo = async (id) => {
    const database = await getHighlightVideoDatabase();
    return new Promise((resolve, reject) => {
        const request = database.transaction('videos', 'readonly').objectStore('videos').get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};
const deleteHighlightVideo = async (id) => {
    try {
        const database = await getHighlightVideoDatabase();
        const transaction = database.transaction('videos', 'readwrite');
        transaction.objectStore('videos').delete(id);
    } catch {
        return;
    }
};
const loadCommunityList = (key, isValid) => {
    try {
        const value = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(value) ? value.filter(isValid) : [];
    } catch {
        return [];
    }
};
let communityFriends = [...new Set(loadCommunityList(communityFriendsStorageKey, (name) => typeof name === 'string' && name.trim()))];
let communityMessages = loadCommunityList(communityMessagesStorageKey, (message) =>
    message && typeof message.to === 'string' && typeof message.from === 'string' && typeof message.text === 'string'
);
let highlightPosts = [];

try {
    const savedHighlights = JSON.parse(localStorage.getItem(highlightStorageKey) || '[]');
    if (Array.isArray(savedHighlights)) {
        highlightPosts = savedHighlights.filter((post) =>
            post && typeof post.id === 'string' && typeof post.gamer === 'string' &&
            typeof post.game === 'string' && typeof post.title === 'string' &&
            typeof post.description === 'string'
        );
    }
} catch {
    localStorage.removeItem(highlightStorageKey);
}

const saveHighlights = () => {
    try {
        localStorage.setItem(highlightStorageKey, JSON.stringify(highlightPosts));
    } catch {
        highlightStatus.textContent = 'Your post is visible for this visit but could not be saved on this device.';
    }
};

const saveCommunityFriends = () => {
    try {
        localStorage.setItem(communityFriendsStorageKey, JSON.stringify(communityFriends));
    } catch {
        highlightStatus.textContent = 'Friend changes are available for this visit but could not be saved.';
    }
};

const renderCommunityFriends = () => {
    if (!communityFriendList) return;
    communityFriendList.replaceChildren();
    communityFriendCount.textContent = String(communityFriends.length);
    communityFriendsEmpty.hidden = communityFriends.length > 0;
    const selectedRecipient = communityMessageTo.value;
    const chooseFriend = document.createElement('option');
    chooseFriend.value = '';
    chooseFriend.textContent = 'Choose a friend';
    communityMessageTo.replaceChildren(chooseFriend);
    communityFriends.forEach((name) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        communityMessageTo.append(option);
    });
    if (selectedRecipient && !communityFriends.some((friend) => friend.toLowerCase() === selectedRecipient.toLowerCase())) {
        const option = document.createElement('option');
        option.value = selectedRecipient;
        option.textContent = selectedRecipient;
        communityMessageTo.append(option);
    }
    communityMessageTo.value = selectedRecipient;
    communityFriends.forEach((name) => {
        const entry = document.createElement('li');
        const friendName = document.createElement('span');
        friendName.textContent = name;
        const friendActions = document.createElement('div');
        friendActions.className = 'community-friend-actions';
        const messageButton = document.createElement('button');
        messageButton.type = 'button';
        messageButton.className = 'community-friend-message';
        messageButton.textContent = 'Message';
        messageButton.setAttribute('aria-label', `Message ${name}`);
        messageButton.addEventListener('click', () => openCommunityDrawer(name));
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'community-friend-remove';
        removeButton.textContent = 'Remove';
        removeButton.setAttribute('aria-label', `Remove ${name} from friends`);
        removeButton.addEventListener('click', () => {
            communityFriends = communityFriends.filter((friend) => friend.toLowerCase() !== name.toLowerCase());
            saveCommunityFriends();
            renderCommunityFriends();
            renderHighlights();
            renderCommunityMessages();
        });
        friendActions.append(messageButton, removeButton);
        entry.append(friendName, friendActions);
        communityFriendList.append(entry);
    });
};

const renderCommunityMessages = () => {
    if (!communityMessageHistory || !communityMessageTo) return;
    const recipient = communityMessageTo.value.trim();
    communityMessageHistory.replaceChildren();
    communityMessageEmpty.hidden = Boolean(recipient);
    communityMessageInput.disabled = !recipient;
    communityMessageForm.querySelector('button[type="submit"]').disabled = !recipient;
    if (!recipient) return;

    const recipientKey = recipient.toLowerCase();
    const conversation = communityMessages.filter((message) =>
        message.to.toLowerCase() === recipientKey || message.from.toLowerCase() === recipientKey
    );
    communityMessageEmpty.hidden = conversation.length > 0;
    if (!conversation.length) communityMessageEmpty.textContent = `No messages with ${recipient} yet.`;
    conversation.forEach((message) => {
        const entry = document.createElement('p');
        entry.className = 'community-message-entry';
        entry.textContent = `${message.from} to ${message.to}: ${message.text}`;
        communityMessageHistory.append(entry);
    });
};

const openCommunityDrawer = (recipient = '') => {
    if (recipient) {
        const hasOption = [...communityMessageTo.options].some((option) => option.value.toLowerCase() === recipient.toLowerCase());
        if (!hasOption) {
            const option = document.createElement('option');
            option.value = recipient;
            option.textContent = recipient;
            communityMessageTo.append(option);
        }
        communityMessageTo.value = recipient;
    }
    renderCommunityMessages();
    if (!communityDrawer.open) {
        communityDrawer.showModal();
        communityDrawer.classList.add('is-open');
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            communityDrawer.animate(
                [{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }],
                { duration: 260, easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)' }
            );
        }
    }
    if (recipient) communityMessageInput.focus();
};

const closeCommunityDrawer = () => {
    if (!communityDrawer?.open) return;
    communityDrawer.classList.remove('is-open');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        communityDrawer.close();
        return;
    }
    const animation = communityDrawer.animate(
        [{ transform: 'translateY(0)' }, { transform: 'translateY(105%)' }],
        { duration: 220, easing: 'cubic-bezier(0.4, 0, 1, 1)' }
    );
    animation.addEventListener('finish', () => {
        if (communityDrawer.open) communityDrawer.close();
    }, { once: true });
};

communityMessageTo?.addEventListener('change', renderCommunityMessages);
communityMessageForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const recipient = communityMessageTo.value.trim();
    const text = communityMessageInput.value.trim();
    if (!recipient || !text) return;

    const sender = sessionStorage.getItem(playerNameStorageKey) || getDisplayName(getStoredAccount() || demoAccount);
    communityMessages.push({ to: recipient, from: sender, text, createdAt: Date.now() });
    try {
        localStorage.setItem(communityMessagesStorageKey, JSON.stringify(communityMessages));
        communityMessageStatus.textContent = 'Message saved on this device; it has not been delivered to other gamers.';
    } catch {
        communityMessageStatus.textContent = 'Message saved for this visit only; it has not been delivered.';
    }
    communityMessageInput.value = '';
    renderCommunityMessages();
});

communityDrawerOpenButton?.addEventListener('click', () => openCommunityDrawer());
communityDrawerCloseButton?.addEventListener('click', closeCommunityDrawer);
communityDrawer?.addEventListener('click', (event) => {
    if (event.target === communityDrawer) communityDrawerCloseButton?.click();
});
communityDrawer?.addEventListener('close', () => communityDrawer.classList.remove('is-open'));

const getHighlightMedia = (value) => {
    try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        if (/\.(mp4|webm|ogg|m4v)$/i.test(url.pathname)) {
            return { kind: 'video', src: url.href };
        }

        const host = url.hostname.toLowerCase();
        const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
        if (youtubeHosts.has(host)) {
            const path = url.pathname.split('/').filter(Boolean);
            const videoId = host === 'youtu.be'
                ? path[0]
                : url.searchParams.get('v') || (['embed', 'shorts', 'live'].includes(path[0]) ? path[1] : '');
            if (/^[A-Za-z0-9_-]{11}$/.test(videoId || '')) {
                return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${videoId}` };
            }
        }

        if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
            const videoId = url.pathname.split('/').filter(Boolean).pop();
            if (/^\d+$/.test(videoId || '')) {
                return { kind: 'embed', src: `https://player.vimeo.com/video/${videoId}` };
            }
        }

        return { kind: 'link', src: url.href };
    } catch {
        return null;
    }
};

const renderHighlights = () => {
    if (!highlightFeed) return;
    highlightFeed.replaceChildren();
    const filter = highlightFilter.value;
    const visiblePosts = highlightPosts.filter((post) => filter === 'all' || post.game === filter);
    highlightEmpty.hidden = visiblePosts.length > 0;
    visiblePosts.forEach((post) => {
        const card = document.createElement('article');
        card.className = 'highlight-post';
        card.dataset.gamer = post.gamer;
        const topLine = document.createElement('div');
        topLine.className = 'highlight-post-meta';
        const byline = document.createElement('strong');
        byline.textContent = post.gamer;
        const game = document.createElement('span');
        game.textContent = post.game;
        topLine.append(byline, game);
        const title = document.createElement('h3');
        title.className = 'highlight-post-title';
        title.textContent = post.title;
        const description = document.createElement('p');
        description.className = 'highlight-post-description';
        description.textContent = post.description;
        card.append(topLine, title, description);

        const uploadedVideoUrl = uploadedHighlightUrls.get(post.id);
        const media = !post.clipFileId && post.clipUrl ? getHighlightMedia(post.clipUrl) : null;
        if (uploadedVideoUrl || post.clipFileId || media?.kind === 'video') {
            const video = document.createElement('video');
            video.className = 'highlight-video';
            if (uploadedVideoUrl) video.src = uploadedVideoUrl;
            else if (media?.kind === 'video') video.src = media.src;
            else video.textContent = 'Loading uploaded video...';
            video.controls = true;
            video.preload = 'metadata';
            video.playsInline = true;
            video.setAttribute('aria-label', `Highlight video: ${post.title}`);
            card.append(video);
        } else if (post.hasUploadedClip) {
            const unavailableClip = document.createElement('p');
            unavailableClip.textContent = 'This uploaded video was only available in the browser session where it was posted.';
            card.append(unavailableClip);
        } else if (media?.kind === 'embed') {
            const frame = document.createElement('iframe');
            frame.className = 'highlight-video-embed';
            frame.src = media.src;
            frame.title = `Highlight video: ${post.title}`;
            frame.loading = 'lazy';
            frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
            frame.referrerPolicy = 'strict-origin-when-cross-origin';
            frame.allowFullscreen = true;
            card.append(frame);
        } else if (media?.kind === 'link') {
            const clipLink = document.createElement('a');
            clipLink.className = 'highlight-clip-link';
            clipLink.href = media.src;
            clipLink.target = '_blank';
            clipLink.rel = 'noopener noreferrer';
            clipLink.textContent = 'Open highlight';
            card.append(clipLink);
        }

        const actions = document.createElement('div');
        actions.className = 'highlight-actions';
        const friendButton = document.createElement('button');
        friendButton.type = 'button';
        friendButton.className = 'highlight-action friend-toggle';
        const friendButtonIcon = document.createElement('span');
        friendButtonIcon.setAttribute('aria-hidden', 'true');
        const friendButtonLabel = document.createElement('span');
        friendButton.append(friendButtonIcon, friendButtonLabel);
        const isFriend = () => communityFriends.some((friend) => friend.toLowerCase() === post.gamer.toLowerCase());
        const updateFriendButton = () => {
            const added = isFriend();
            friendButtonIcon.textContent = added ? '✓' : '+';
            friendButtonLabel.textContent = added ? 'Friend added' : 'Add friend';
            friendButton.setAttribute('aria-label', added ? `Remove ${post.gamer} from friends` : `Add ${post.gamer} as a friend`);
            friendButton.setAttribute('aria-pressed', String(added));
        };
        updateFriendButton();
        friendButton.addEventListener('click', () => {
            if (isFriend()) {
                communityFriends = communityFriends.filter((friend) => friend.toLowerCase() !== post.gamer.toLowerCase());
            } else {
                communityFriends.push(post.gamer);
            }
            saveCommunityFriends();
            renderCommunityFriends();
            updateFriendButton();
        });

        const messageButton = document.createElement('button');
        messageButton.type = 'button';
        messageButton.className = 'highlight-action highlight-message-button';
        messageButton.textContent = 'Message';
        messageButton.addEventListener('click', () => openCommunityDrawer(post.gamer));
        actions.append(friendButton, messageButton);
        card.append(actions);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'highlight-remove';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
            highlightPosts = highlightPosts.filter((currentPost) => currentPost.id !== post.id);
            const uploadedUrl = uploadedHighlightUrls.get(post.id);
            if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
            uploadedHighlightUrls.delete(post.id);
            if (post.clipFileId) void deleteHighlightVideo(post.id);
            saveHighlights();
            renderHighlights();
        });
        card.append(removeButton);
        highlightFeed.append(card);
    });
};

highlightFilter?.addEventListener('change', renderHighlights);
document.querySelector('#highlight-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const videoFile = form.querySelector('#highlight-video-file').files[0];
    const clipUrl = form.querySelector('#highlight-link').value.trim();
    const allowedVideoTypes = new Set(['video/mp4', 'video/webm', 'video/ogg', '']);
    const supportedExtension = /\.(mp4|webm|ogg|m4v)$/i.test(videoFile?.name || '');
    if (videoFile && (!allowedVideoTypes.has(videoFile.type) && !supportedExtension)) {
        highlightStatus.textContent = 'Choose an MP4, WebM, or Ogg video file.';
        return;
    }
    if (videoFile && videoFile.size > 50 * 1024 * 1024) {
        highlightStatus.textContent = 'Videos must be 50 MB or smaller.';
        return;
    }
    if (videoFile && clipUrl) {
        highlightStatus.textContent = 'Choose a video URL or upload a file, not both.';
        return;
    }
    const post = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        gamer: form.querySelector('#highlight-player').value.trim(),
        game: form.querySelector('#highlight-game').value,
        title: form.querySelector('#highlight-title').value.trim(),
        description: form.querySelector('#highlight-description').value.trim(),
        clipUrl,
        clipFileId: '',
        hasUploadedClip: Boolean(videoFile),
        createdAt: Date.now()
    };
    if (!post.gamer || !post.title || !post.description) return;

    if (videoFile) {
        post.clipFileId = post.id;
        try {
            await saveHighlightVideo(post.id, videoFile);
        } catch {
            post.clipFileId = '';
        }
        uploadedHighlightUrls.set(post.id, URL.createObjectURL(videoFile));
    }

    highlightPosts.unshift(post);
    saveHighlights();
    renderHighlights();
    form.reset();
    highlightStatus.textContent = videoFile && !post.clipFileId
        ? 'Highlight posted. The uploaded video is available until this page is closed because browser storage is unavailable.'
        : 'Highlight posted.';
});
renderHighlights();
const restoreUploadedHighlightVideos = async () => {
    for (const post of highlightPosts.filter((highlight) => highlight.clipFileId)) {
        try {
            const file = await getHighlightVideo(post.clipFileId);
            if (file instanceof Blob) uploadedHighlightUrls.set(post.id, URL.createObjectURL(file));
        } catch {
            continue;
        }
    }
    renderHighlights();
};
void restoreUploadedHighlightVideos();
renderCommunityFriends();
renderCommunityMessages();

const communityPanel = document.querySelector('#community-post-panel');
const communityPanelToggle = document.querySelector('#community-panel-toggle');
const communityPanelStorageKey = 'galaxy-community-panel-hidden';
let communityPanelExpanded = true;
try {
    communityPanelExpanded = localStorage.getItem(communityPanelStorageKey) !== 'true';
} catch {
    communityPanelExpanded = true;
}

const setCommunityPanelExpanded = (expanded) => {
    if (!communityPanel || !communityPanelToggle) return;
    communityPanelExpanded = expanded;
    communityPanel.inert = !expanded;
    communityPanel.setAttribute('aria-hidden', String(!expanded));
    communityPanel.classList.toggle('community-post-panel--collapsed', !expanded);
    communityPanelToggle.setAttribute('aria-expanded', String(expanded));
    communityPanelToggle.textContent = expanded ? 'Hide upload and friends' : 'Show upload and friends';
    try {
        localStorage.setItem(communityPanelStorageKey, String(!expanded));
    } catch {
        return;
    }
};

setCommunityPanelExpanded(communityPanelExpanded);
communityPanelToggle?.addEventListener('click', () => {
    setCommunityPanelExpanded(!communityPanelExpanded);
});

const highlightsDrawer = document.querySelector('#highlights-drawer');
const highlightsDrawerOpen = document.querySelector('#highlights-drawer-open');
const highlightsDrawerClose = document.querySelector('#highlights-drawer-close');

highlightsDrawerOpen?.addEventListener('click', () => {
    if (!highlightsDrawer || highlightsDrawer.open) return;
    highlightsDrawer.showModal();
    highlightsDrawer.classList.add('is-open');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        highlightsDrawer.animate(
            [{ transform: 'translateX(-105%)' }, { transform: 'translateX(0)' }],
            { duration: 280, easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)' }
        );
    }
});

const closeHighlightsDrawer = () => {
    if (!highlightsDrawer?.open) return;
    highlightsDrawer.classList.remove('is-open');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        highlightsDrawer.close();
        return;
    }
    const animation = highlightsDrawer.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-105%)' }],
        { duration: 240, easing: 'cubic-bezier(0.4, 0, 1, 1)' }
    );
    animation.addEventListener('finish', () => {
        if (highlightsDrawer.open) highlightsDrawer.close();
    }, { once: true });
};

highlightsDrawerClose?.addEventListener('click', closeHighlightsDrawer);
highlightsDrawer?.addEventListener('click', (event) => {
    if (event.target === highlightsDrawer) closeHighlightsDrawer();
});
highlightsDrawer?.addEventListener('close', () => {
    highlightsDrawer.classList.remove('is-open');
});

const leaderboardDrawer = document.querySelector('#leaderboard-drawer');
const leaderboardDrawerOpen = document.querySelector('#leaderboard-drawer-open');
const leaderboardDrawerClose = document.querySelector('#leaderboard-drawer-close');

leaderboardDrawerOpen?.addEventListener('click', () => {
    if (!leaderboardDrawer || leaderboardDrawer.open) return;
    leaderboardDrawer.showModal();
    leaderboardDrawer.classList.add('is-open');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        leaderboardDrawer.animate(
            [{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }],
            { duration: 260, easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)' }
        );
    }
});

const closeLeaderboardDrawer = () => {
    if (!leaderboardDrawer?.open) return;
    leaderboardDrawer.classList.remove('is-open');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        leaderboardDrawer.close();
        return;
    }
    const animation = leaderboardDrawer.animate(
        [{ transform: 'translateY(0)' }, { transform: 'translateY(105%)' }],
        { duration: 220, easing: 'cubic-bezier(0.4, 0, 1, 1)' }
    );
    animation.addEventListener('finish', () => {
        if (leaderboardDrawer.open) leaderboardDrawer.close();
    }, { once: true });
};

leaderboardDrawerClose?.addEventListener('click', closeLeaderboardDrawer);
leaderboardDrawer?.addEventListener('click', (event) => {
    if (event.target === leaderboardDrawer) closeLeaderboardDrawer();
});
leaderboardDrawer?.addEventListener('close', () => {
    leaderboardDrawer.classList.remove('is-open');
});
