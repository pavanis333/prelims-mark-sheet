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

// ── Validate PAT → returns GitHub username ──
export const validatePAT = async (pat) => {
    const res = await fetch('https://api.github.com/user', {
        headers: authHeaders(pat),
    });
    if (!res.ok) throw new Error('Invalid token — check your PAT and try again.');
    const user = await res.json();
    return user.login;
};

// ── Find existing tracker Gist by scanning user's gists ──────────────────────
// Returns gistId string or null if not found
export const findTrackerGist = async (pat) => {
    let page = 1;
    while (true) {
        const res = await fetch(`https://api.github.com/gists?per_page=100&page=${page}`, {
            headers: authHeaders(pat),
        });
        if (!res.ok) throw new Error(`Could not list gists (${res.status})`);
        const gists = await res.json();
        if (gists.length === 0) break;

        const match = gists.find(g => g.files && g.files[GIST_FILENAME]);
        if (match) return match.id;

        if (gists.length < 100) break; // last page
        page++;
    }
    return null;
};

// ── Connect: validate PAT + auto-discover existing Gist ──────────────────────
// Returns { username, gistId (or null), data (or null) }
export const connectAndDiscover = async (pat) => {
    const username = await validatePAT(pat);
    const gistId   = await findTrackerGist(pat);

    let data = null;
    if (gistId) {
        // fetch content from the discovered gist
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: authHeaders(pat),
        });
        if (res.ok) {
            const gist    = await res.json();
            const content = gist.files?.[GIST_FILENAME]?.content;
            if (content) data = JSON.parse(content);
        }
    }

    setGistConfig({ pat, username, gistId, lastSync: data ? new Date().toISOString() : null });
    return { username, gistId, data };
};

// ── Fetch data from stored Gist ───────────────────────────────────────────────
export const fetchFromGist = async () => {
    const config = getGistConfig();
    if (!config?.pat) return null;

    // If no gistId stored yet, try to discover it first
    if (!config.gistId) {
        const gistId = await findTrackerGist(config.pat);
        if (!gistId) return null;
        setGistConfig({ ...config, gistId });
    }

    const { gistId, pat } = getGistConfig();
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: authHeaders(pat),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Gist fetch failed (${res.status})`);

    const gist    = await res.json();
    const content = gist.files?.[GIST_FILENAME]?.content;
    if (!content) return null;
    return JSON.parse(content);
};

// ── Push data to Gist — creates on first call, patches after ─────────────────
export const pushToGist = async (data) => {
    const config = getGistConfig();
    if (!config?.pat) return;

    const content = JSON.stringify(data, null, 2);

    if (!config.gistId) {
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
        setGistConfig({ ...getGistConfig(), gistId: gist.id, lastSync: new Date().toISOString() });
    } else {
        const res = await fetch(`https://api.github.com/gists/${config.gistId}`, {
            method: 'PATCH',
            headers: authHeaders(config.pat),
            body: JSON.stringify({
                files: { [GIST_FILENAME]: { content } },
            }),
        });
        if (!res.ok) throw new Error(`Gist update failed (${res.status})`);
        setGistConfig({ ...getGistConfig(), lastSync: new Date().toISOString() });
    }
};
