const STORAGE_KEY = 'upsc_tracker_data';

export const getStoredData = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return { tests: [] };

        const parsed = JSON.parse(data);
        let hasChanges = false;

        // Migration: Ensure all tests have IDs
        const migratedTests = parsed.tests.map((t, idx) => {
            if (!t.id) {
                hasChanges = true;
                return { ...t, id: `${Date.now()}-${idx}` };
            }
            return t;
        });

        if (hasChanges) {
            const newData = { ...parsed, tests: migratedTests };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            return newData;
        }

        return parsed;
    } catch (error) {
        console.error('Error loading data:', error);
        return { tests: [] };
    }
};

export const saveTestResult = (testResult) => {
    try {
        const currentData = getStoredData();
        const newTest = { ...testResult, id: Date.now().toString() };
        const newData = {
            ...currentData,
            tests: [newTest, ...currentData.tests]
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        return newData;
    } catch (error) {
        console.error('Error saving data:', error);
        return null;
    }
};

export const deleteResult = (id) => {
    try {
        const currentData = getStoredData();
        const newData = {
            ...currentData,
            tests: currentData.tests.filter(t => t.id !== id)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        return newData;
    } catch (error) {
        console.error('Error deleting data:', error);
        return null;
    }
};

export const updateResult = (updatedTest) => {
    try {
        const currentData = getStoredData();
        const newData = {
            ...currentData,
            tests: currentData.tests.map(t => t.id === updatedTest.id ? updatedTest : t)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        return newData;
    } catch (error) {
        console.error('Error updating data:', error);
        return null;
    }
};

export const clearData = () => {
    localStorage.removeItem(STORAGE_KEY);
    return { tests: [] };
};

// ── Export: download all data as a JSON file ──────────────────────────────
export const exportData = () => {
    const data = getStoredData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href     = url;
    a.download = `upsc-tracker-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// ── Import: merge or replace data from a JSON file ───────────────────────
export const importData = (jsonString, mode = 'merge') => {
    try {
        const incoming = JSON.parse(jsonString);
        if (!incoming?.tests || !Array.isArray(incoming.tests)) {
            throw new Error('Invalid backup file — no tests array found.');
        }

        if (mode === 'replace') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
            return getStoredData();
        }

        // merge: add only tests whose id doesn't already exist
        const current    = getStoredData();
        const existingIds = new Set(current.tests.map(t => t.id));
        const newTests   = incoming.tests.filter(t => !existingIds.has(t.id));
        const merged     = {
            ...current,
            tests: [...current.tests, ...newTests]
                .sort((a, b) => new Date(b.date) - new Date(a.date)),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return { data: getStoredData(), added: newTests.length };
    } catch (err) {
        throw new Error(err.message || 'Failed to parse backup file.');
    }
};

