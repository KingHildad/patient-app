/**
 * API service layer.
 *
 * TODO: once the Postman collection is exported, replace BASE_URL, the
 * endpoint paths below, and the request/response shapes to match it exactly.
 * Every function here already gets called at the right point in the flow
 * (see app.js) — this file is the only one that should need to change.
 *
 * Assessment doc + Postman overview confirm:
 *   - dev base URL:  http://localhost:8181/api
 *   - prod base URL: https://patientvisitapis.intellisoftkenya.com/api
 *   - auth: Laravel Sanctum bearer token (endpoint TBD from collection)
 */

const API_CONFIG = {
  baseUrl: "http://localhost/patient-app/backend/api/patients.php",
  authToken: null, // TODO: set after wiring a login/token endpoint, if one exists
  // Flip to true once BASE_URL + endpoints below are confirmed against the
  // real collection. While false, the app runs entirely on local state so
  // the UI/flow can be built and demoed before the backend is wired in.
  enabled: true,
};

async function apiRequest(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (API_CONFIG.authToken) headers.Authorization = `Bearer ${API_CONFIG.authToken}`;

  const res = await fetch(`${API_CONFIG.baseUrl}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${options.method || "GET"} ${path} failed (${res.status}): ${body}`);
  }
  return res.status === 204 ? null : res.json();
}

const api = {
  /** POST /patients — TODO confirm path + field names against the collection */
  async registerPatient(patient) {
    if (!API_CONFIG.enabled) return { ...patient, _local: true };
    return apiRequest("/patients", { method: "POST", body: JSON.stringify(patient) });
  },

  /** POST /vitals — TODO confirm path + field names against the collection */
  async submitVitals(vitals) {
    if (!API_CONFIG.enabled) return { ...vitals, _local: true };
    return apiRequest("/vitals", { method: "POST", body: JSON.stringify(vitals) });
  },

  /** POST /visits — TODO confirm path + field names against the collection */
  async submitVisitForm(visitForm) {
    if (!API_CONFIG.enabled) return { ...visitForm, _local: true };
    return apiRequest("/visits", { method: "POST", body: JSON.stringify(visitForm) });
  },

  /** GET /patients — used to render the listing screen, TODO confirm path */
  async listPatients() {
    if (!API_CONFIG.enabled) return null; // app.js falls back to local state
    return apiRequest("/patients", { method: "GET" });
  },
};
