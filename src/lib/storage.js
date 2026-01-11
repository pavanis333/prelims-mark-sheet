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
