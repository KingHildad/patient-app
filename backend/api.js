/**
 * API service layer — talks to the PHP/MySQL backend in backend/api/.
 *
 * How this maps to XAMPP:
 *   - Put the whole `backend/` folder inside your XAMPP htdocs (e.g.
 *     C:\xampp\htdocs\patient-app\backend or
 *     /Applications/XAMPP/xamppfiles/htdocs/patient-app/backend).
 *   - Import backend/schema.sql once via phpMyAdmin (or mysql CLI).
 *   - BASE_URL below then becomes wherever Apache serves that folder from,
 *     e.g. http://localhost/patient-app/backend/api
 */

const API_CONFIG = {
  baseUrl: "http://localhost:8080/api",
  authToken: null, // not needed for the XAMPP/MySQL backend
  // Flip to true once the PHP backend (backend/api/*.php) is running under
  // XAMPP and the schema (backend/schema.sql) has been imported.
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
  /** POST /patients.php */
  async registerPatient(patient) {
    if (!API_CONFIG.enabled) return { ...patient, _local: true };
    return apiRequest("/patients.php", { method: "POST", body: JSON.stringify(patient) });
  },

  /** POST /vitals.php */
  async submitVitals(vitals) {
    if (!API_CONFIG.enabled) return { ...vitals, _local: true };
    return apiRequest("/vitals.php", { method: "POST", body: JSON.stringify(vitals) });
  },

  /** POST /visits.php */
  async submitVisitForm(visitForm) {
    if (!API_CONFIG.enabled) return { ...visitForm, _local: true };
    return apiRequest("/visits.php", { method: "POST", body: JSON.stringify(visitForm) });
  },

  /** GET /patients.php — not yet used by app.js, which renders from local
   *  state so the UI stays fast; available if you switch the listing screen
   *  to fetch from the server instead. */
  async listPatients() {
    if (!API_CONFIG.enabled) return null;
    return apiRequest("/patients.php", { method: "GET" });
  },
};
