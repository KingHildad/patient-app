# Patient Vitals & Assessment — Frontend

Web app for the IntelliSOFT technical assessment. Built with plain HTML, CSS and JavaScript (no framework/build step).

## Approach

Consuming the existing backend from the provided Postman collection rather than building a new one (`js/api.js`). Base URLs and auth are wired from the collection overview; individual endpoint paths/payloads in `js/api.js` are marked `TODO` pending the full exported collection — until confirmed, `API_CONFIG.enabled` is `false` and the app runs on local state (`localStorage`) so the full flow is usable end-to-end in the meantime.

## Structure

```
index.html        All 5 screens (registration, vitals, overweight/general assessment, listing)
css/styles.css     Styling
js/api.js          Backend integration layer — endpoints to be finalized against the Postman collection
js/app.js          State, navigation, validation, BMI logic, listing/filtering
```

## Run it

No build step — open `index.html` in a browser, or serve the folder statically:

```
npx serve .
```

## Flow

1. **Register** a patient (unique patient ID enforced client-side).
2. **Vitals** — height/weight entered, BMI calculated automatically.
3. Saving vitals routes to the **General** assessment (BMI &le; 25) or **Overweight** assessment (BMI &gt; 25).
4. Saving the assessment lands on the **Patient listing**, filterable by visit date, showing each patient's age and BMI status (Underweight / Normal / Overweight).

## Note on the BMI-25 boundary

The brief states the vitals step routes at "BMI &le; 25 &rarr; General, BMI &gt; 25 &rarr; Overweight," while the listing step defines status as "Normal &lt; 25, Overweight &ge; 25." Both are implemented literally as written in their respective sections (see comment in `js/app.js`) rather than silently merged into one rule.
