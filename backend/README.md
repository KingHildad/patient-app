

## Setup & running it (XAMPP)

1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Copy the whole `backend/` folder into your XAMPP `htdocs`, e.g.
   `C:\xampp\htdocs\patient-app\backend` (Windows) or
   `/Applications/XAMPP/xamppfiles/htdocs/patient-app/backend` (Mac).
3. Open **phpMyAdmin** → Import → select `backend/schema.sql`. This creates the `patient_app` database and its three tables (`patients`, `vitals`, `visit_forms`).
4. Confirm the API responds: visit `http://localhost/patient-app/backend/api/patients.php` in a browser — you should see `{"data":[]}`.
5. In `js/api.js`, confirm `API_CONFIG.baseUrl` matches step 4 (`http://localhost/patient-app/backend/api`) and `enabled` is `true`.
6. Open `index.html` via VS Code **Live Server** (or `python3 -m http.server`) as its own static site, separate from the XAMPP URL — the API's CORS headers already allow cross-origin requests.

## Flow

1. **Register** a patient (unique patient ID enforced both client-side and by the database).
2. **Vitals** — height/weight entered, BMI calculated automatically.
3. Saving vitals routes to the **General** assessment (BMI ≤ 25) or **Overweight** assessment (BMI > 25).
4. Saving the assessment lands on the **Patient listing**, filterable by visit date, showing each patient's age and BMI status (Underweight / Normal / Overweight).

## Design notes

- **Resilient by design**: every form submission also calls the backend API. If the server is unreachable, the app falls back to local state (`localStorage`) and notifies the user, rather than losing data.
- **Duplicate prevention at two layers**: checked client-side for instant feedback, and enforced by a `UNIQUE(patient_id, visit_date)` constraint in MySQL so it holds even for direct API calls.
- **BMI-25 boundary**: the brief defines the cutoff slightly differently in two places — the vitals step routes at "BMI ≤ 25 → General, BMI > 25 → Overweight," while the listing step defines status as "Normal < 25, Overweight ≥ 25." Both are implemented literally as written in their respective sections (see the comment above `routeForBmi()` and `bmiStatusLabel()` in `js/app.js`) rather than silently merged into one rule.