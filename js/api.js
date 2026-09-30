"use strict";

/**
 * API service layer — talks to the PHP/MySQL backend in backend/api/.
 *
 * This is the only file that should need to change to point the app at a
 * different backend location.
 *
 * How this maps to XAMPP:
 *   - The whole `backend/` folder lives inside XAMPP's htdocs, e.g.
 *     C:\xampp\htdocs\patient-app\backend
 *     or /Applications/XAMPP/xamppfiles/htdocs/patient-app/backend
 *   - backend/schema.sql has been imported once via phpMyAdmin.
 *   - baseUrl below is the *folder* Apache serves that backend/api/ from —
 *     no filename on the end. Each function below appends its own
 *     endpoint filename (/patients.php, /vitals.php, /visits.php).
 */

const API_CONFIG = {
  baseUrl: "http://localhost/patient-app/backend/api",
  authToken: null, // not needed — this backend has no auth layer
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
  /** POST /patients.php — register a new patient */
  async registerPatient(patient) {
    if (!API_CONFIG.enabled) return { ...patient, _local: true };
    return apiRequest("/patients.php", { method: "POST", body: JSON.stringify(patient) });
  },

  /** POST /vitals.php — record height/weight for a visit; server computes BMI */
  async submitVitals(vitals) {
    if (!API_CONFIG.enabled) return { ...vitals, _local: true };
    return apiRequest("/vitals.php", { method: "POST", body: JSON.stringify(vitals) });
  },

  /** POST /visits.php — record the general/overweight assessment form */
  async submitVisitForm(visitForm) {
    if (!API_CONFIG.enabled) return { ...visitForm, _local: true };
    return apiRequest("/visits.php", { method: "POST", body: JSON.stringify(visitForm) });
  },

  /** GET /patients.php — not currently called by app.js, which renders the
   *  listing from local state for speed; available if you'd rather have
   *  the listing screen fetch live from the server instead. */
  async listPatients() {
    if (!API_CONFIG.enabled) return null;
    return apiRequest("/patients.php", { method: "GET" });
  },
};