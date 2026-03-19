// ── GitHub Gist Sync ─────────────────────────────────────────────────────────
const GIST_CONFIG_KEY = 'upsc_gist_config';
const GIST_FILENAME   = 'upsc-tracker-data.json';

const authHeaders = (pat) => ({
    'Authorization': `Bearer ${pat}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
});

export const getGistConfig = () => {
    try { return JSON.parse(localStorage.getItem(GIST_CONFIG_KEY) || 'null'); }
    catch { return null; }
};

export const setGistConfig = (config) =>
    localStorage.setItem(GIST_CONFIG_KEY, JSON.stringify(config));

export const clearGistConfig = () =>
    localStorage.removeItem(GIST_CONFIG_KEY);

export const isGistConfigured = () => !!getGistConfig()?.pat;

// Validate PAT and return GitHub username
export const validatePAT = async (pat) => {
    const res = await fetch('https://api.github.com/user', {
        headers: authHeaders(pat),
    });
    if (!res.ok) throw new Error('Invalid token — check your PAT and try again.');
    const user = await res.json();
    return user.login;
};

// Fetch data from Gist → returns parsed JS object or null
export const fetchFromGist = async () => {
    const config = getGistConfig();
    if (!config?.pat || !config?.gistId) return null;

    const res = await fetch(`https://api.github.com/gists/${config.gistId}`, {
        headers: authHeaders(config.pat),
    });
    if (res.status === 404) { return null; }
    if (!res.ok) throw new Error(`Gist fetch failed (${res.status})`);

    const gist    = await res.json();
    const content = gist.files?.[GIST_FILENAME]?.content;
    if (!content) return null;
    return JSON.parse(content);
};

// Push data to Gist — creates on first call, patches after
export const pushToGist = async (data) => {
    const config = getGistConfig();
    if (!config?.pat) return;

    const content = JSON.stringify(data, null, 2);

    if (!config.gistId) {
        // First time — create a new secret Gist
        const res = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: authHeaders(config.pat),
            body: JSON.stringify({
                description: 'UPSC Prelims Tracker — Auto Backup',
                public: false,
                files: { [GIST_FILENAME]: { content } },
            }),
        });
        if (!res.ok) throw new Error(`Gist create failed (${res.status})`);
        const gist = await res.json();
        setGistConfig({ ...config, gistId: gist.id });
    } else {
        // Update existing Gist
        const res = await fetch(`https://api.github.com/gists/${config.gistId}`, {
            method: 'PATCH',
            headers: authHeaders(config.pat),
            body: JSON.stringify({
                files: { [GIST_FILENAME]: { content } },
            }),
        });
        if (!res.ok) throw new Error(`Gist update failed (${res.status})`);
    }

    // Record last sync time
    setGistConfig({ ...getGistConfig(), lastSync: new Date().toISOString() });
};
