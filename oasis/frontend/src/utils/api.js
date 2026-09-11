// Centralized API configuration and cross-device sync helpers for OASIS

let globalEnvUrl = import.meta.env.VITE_API_URL;
if (globalEnvUrl && globalEnvUrl.includes('localhost') && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    globalEnvUrl = null;
}

export const API_URL = globalEnvUrl ||
    ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.')))
        ? `http://${window.location.hostname}:5046`
        : 'https://oasis-production-6303.up.railway.app');

/**
 * Saves a clinical test result both to local storage and syncs it to the cloud backend.
 */
export async function syncTestResultToCloud(patientName, testId, result, informante = null) {
    if (!patientName || !testId || !result) return false;

    try {
        const jsonStr = typeof result === 'string' ? result : JSON.stringify(result);

        // 1. LocalStorage keys
        const baseKey = `oasis_test_result_${patientName}_${testId}`;
        const keyWithInf = informante ? `${baseKey}_${informante}` : baseKey;
        localStorage.setItem(keyWithInf, jsonStr);
        if (informante) {
            localStorage.setItem(baseKey, jsonStr);
        }

        // Double underscore format for guaranteed cloud key matching
        const doubleUnderscoreBase = `oasis_test_result_${patientName}__${testId}`;
        const doubleUnderscoreKey = informante ? `${doubleUnderscoreBase}_${informante}` : doubleUnderscoreBase;
        localStorage.setItem(doubleUnderscoreKey, jsonStr);
        if (informante) {
            localStorage.setItem(doubleUnderscoreBase, jsonStr);
        }

        // Test index
        const indexKey = `oasis_tests_index_${patientName}`;
        let existingIndex = [];
        try {
            existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
        } catch (e) {
            existingIndex = [];
        }
        if (!existingIndex.includes(testId)) {
            existingIndex.push(testId);
            localStorage.setItem(indexKey, JSON.stringify(existingIndex));
        }

        // 2. Cloud payload to Railway backend
        const payload = {
            [keyWithInf]: jsonStr,
            [baseKey]: jsonStr,
            [doubleUnderscoreKey]: jsonStr,
            [doubleUnderscoreBase]: jsonStr,
            [indexKey]: JSON.stringify(existingIndex)
        };

        const caller = localStorage.getItem('oasis_user') || 'observador1';
        await fetch(`${API_URL}/api/oasis/clinical-data?user=${encodeURIComponent(patientName)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Oasis-User': caller
            },
            body: JSON.stringify(payload)
        });

        return true;
    } catch (e) {
        console.error("Error syncing test result to cloud:", e);
        return false;
    }
}

/**
 * Scans local storage for any test results belonging to this patient and syncs them all to cloud.
 */
export async function syncAllLocalPatientTestsToCloud(patientName) {
    if (!patientName || typeof window === 'undefined') return;

    try {
        const payload = {};
        let foundAny = false;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            if (key.startsWith(`oasis_test_result_${patientName}`) || key.startsWith(`oasis_tests_index_${patientName}`)) {
                const val = localStorage.getItem(key);
                if (val) {
                    payload[key] = val;
                    // Also create double underscore variant
                    if (key.startsWith(`oasis_test_result_${patientName}_`) && !key.includes('__')) {
                        const sub = key.replace(`oasis_test_result_${patientName}_`, '');
                        payload[`oasis_test_result_${patientName}__${sub}`] = val;
                    }
                    foundAny = true;
                }
            }
        }

        if (foundAny) {
            const caller = localStorage.getItem('oasis_user') || 'observador1';
            await fetch(`${API_URL}/api/oasis/clinical-data?user=${encodeURIComponent(patientName)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Oasis-User': caller
                },
                body: JSON.stringify(payload)
            });
        }
    } catch (e) {
        console.error("Error in syncAllLocalPatientTestsToCloud:", e);
    }
}

/**
 * Retrieves a saved test result checking both single and double underscore formats.
 */
export function getSavedTestResult(patientName, testId, informante = null) {
    if (!patientName || !testId || typeof window === 'undefined') return null;

    try {
        const candidates = [];
        if (informante) {
            candidates.push(`oasis_test_result_${patientName}_${testId}_${informante}`);
            candidates.push(`oasis_test_result_${patientName}__${testId}_${informante}`);
        }
        candidates.push(`oasis_test_result_${patientName}_${testId}`);
        candidates.push(`oasis_test_result_${patientName}__${testId}`);

        if (testId === 'sdq') {
            candidates.push(`oasis_test_result_${patientName}_sdq_adolescente`);
            candidates.push(`oasis_test_result_${patientName}__sdq_adolescente`);
            candidates.push(`oasis_test_result_${patientName}_sdq_madre`);
            candidates.push(`oasis_test_result_${patientName}__sdq_madre`);
        }

        for (const k of candidates) {
            const raw = localStorage.getItem(k);
            if (raw) {
                return JSON.parse(raw);
            }
        }
    } catch (e) {}

    return null;
}
