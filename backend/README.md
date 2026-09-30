# Patient Vitals & Assessment — Frontend

Web app for the IntelliSOFT technical assessment. Built with plain HTML, CSS and JavaScript (no framework/build step).

## Approach

Building our own backend (PHP + MySQL, run under XAMPP) rather than consuming IntelliSOFT's API. See `backend/` for the PHP endpoints and `backend/schema.sql` for the database.

## Structure

```
index.html         All 5 screens (registration, vitals, overweight/general assessment, listing)
css/styles.css      Styling
js/api.js           Calls the PHP backend below
js/app.js           State, navigation, validation, BMI logic, listing/filtering
backend/schema.sql  MySQL schema — import this once
backend/api/
  config.php        DB connection + CORS/JSON helpers
  patients.php      POST register a patient, GET list patients
  vitals.php        POST record vitals for a visit (server computes/stores BMI too)
  visits.php        POST record a general/overweight assessment
```

## Run it — XAMPP setup

1. Start Apache and MySQL in the XAMPP control panel.
2. Copy the whole `backend/` folder into your XAMPP `htdocs`, e.g.
   `C:\xampp\htdocs\patient-app\backend` (Windows) or
   `/Applications/XAMPP/xamppfiles/htdocs/patient-app/backend` (Mac).
3. Open **phpMyAdmin** → Import → select `backend/schema.sql`. This creates the
   `patient_app` database and its three tables.
4. Confirm the API responds: visit `http://localhost/patient-app/backend/api/patients.php`
   in a browser — you should see `[]`.
5. In `js/api.js`, set `API_CONFIG.baseUrl` to match step 4, e.g.
   `http://localhost/patient-app/backend/api`, and leave `enabled: true`.
6. Open `index.html` via VS Code **Live Server** (or `python3 -m http.server`)
   — as its own static site, separate from the XAMPP URL. The API's CORS
   headers already allow that.

## Flow

1. **Register** a patient (unique patient ID enforced client-side).
2. **Vitals** — height/weight entered, BMI calculated automatically.
3. Saving vitals routes to the **General** assessment (BMI &le; 25) or **Overweight** assessment (BMI &gt; 25).
4. Saving the assessment lands on the **Patient listing**, filterable by visit date, showing each patient's age and BMI status (Underweight / Normal / Overweight).

## Note on the BMI-25 boundary

The brief states the vitals step routes at "BMI &le; 25 &rarr; General, BMI &gt; 25 &rarr; Overweight," while the listing step defines status as "Normal &lt; 25, Overweight &ge; 25." Both are implemented literally as written in their respective sections (see comment in `js/app.js`) rather than silently merged into one rule.
