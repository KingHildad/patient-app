"use strict";

/* ============================== STATE ============================== */

const STORAGE_KEY = "patientApp.state.v1";

/**
 * patients: [{
 *   patientId, firstName, lastName, dob, gender, registrationDate,
 *   vitals: [{ visitDate, height, weight, bmi }],
 *   visitForms: [{ visitDate, type: "general"|"overweight", generalHealth,
 *                   extra, comments, bmiAtVisit }]
 * }]
 */
const state = loadState() ?? { patients: [] };
let activePatientId = null;
let pendingVisitDate = null;
let pendingBmi = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getActivePatient() {
  return state.patients.find((p) => p.patientId === activePatientId) || null;
}

/* ============================== HELPERS ============================== */

function calcAge(dobStr, onDate = new Date()) {
  const dob = new Date(dobStr);
  let age = onDate.getFullYear() - dob.getFullYear();
  const m = onDate.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && onDate.getDate() < dob.getDate())) age--;
  return age;
}

function calcBmi(heightCm, weightKg) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * NOTE ON THE SPEC: the brief gives two slightly different BMI-25 boundaries:
 *  - "Vitals" step: BMI <= 25 -> General form, BMI > 25 -> Overweight form.
 *  - "Patient listing" step: Normal is BMI < 25, Overweight is BMI >= 25.
 * Both are implemented literally as written, per their own section, rather
 * than silently reconciled — routeForBmi() drives which form loads next,
 * bmiStatusLabel() drives the status shown in the listing table.
 */
function routeForBmi(bmi) {
  return bmi <= 25 ? "general" : "overweight";
}

function bmiStatusLabel(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  return "Overweight";
}

function statusPillClass(status) {
  if (status === "Underweight") return "status-pill--under";
  if (status === "Overweight") return "status-pill--over";
  return "status-pill--normal";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (toast.hidden = true), 2600);
}

function setFieldError(inputId, message) {
  const errEl = document.querySelector(`[data-error-for="${inputId}"]`);
  if (errEl) errEl.textContent = message || "";
}

function clearErrors(form) {
  form.querySelectorAll(".field__error").forEach((el) => (el.textContent = ""));
}

/* ============================== NAVIGATION ============================== */

const SCREEN_IDS = {
  registration: "screen-registration",
  vitals: "screen-vitals",
  overweight: "screen-assessment-overweight",
  general: "screen-assessment-general",
  listing: "screen-listing",
};

const STEP_FOR_SCREEN = {
  registration: "registration",
  vitals: "vitals",
  overweight: "assessment",
  general: "assessment",
  listing: "listing",
};

function showScreen(screenKey) {
  Object.values(SCREEN_IDS).forEach((id) => {
    document.getElementById(id).hidden = true;
  });
  document.getElementById(SCREEN_IDS[screenKey]).hidden = false;

  const stepKey = STEP_FOR_SCREEN[screenKey];
  document.querySelectorAll(".step").forEach((btn) => {
    btn.removeAttribute("aria-current");
    if (btn.dataset.step === stepKey) btn.setAttribute("aria-current", "step");
  });

  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function markStepComplete(stepKey) {
  const btn = document.querySelector(`.step[data-step="${stepKey}"]`);
  if (btn) btn.classList.add("is-complete");
}

function updatePatientBadge() {
  const patient = getActivePatient();
  const badge = document.getElementById("activePatientBadge");
  if (!patient) {
    badge.hidden = true;
    return;
  }
  document.getElementById("activePatientName").textContent =
    `${patient.firstName} ${patient.lastName}`;
  badge.hidden = false;
}

document.querySelectorAll(".step").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.step;
    if (target === "listing") {
      renderListing();
      showScreen("listing");
      return;
    }
    if (target === "registration") {
      showScreen("registration");
      return;
    }
    if (!activePatientId) {
      showToast("Register a patient first.");
      return;
    }
    if (target === "vitals") {
      showScreen("vitals");
      return;
    }
    if (target === "assessment") {
      if (!pendingBmi) {
        showToast("Save vitals first.");
        return;
      }
      showScreen(routeForBmi(pendingBmi));
    }
  });
});

document.querySelectorAll("[data-nav]").forEach((btn) => {
  btn.addEventListener("click", () => showScreen(btn.dataset.nav));
});

/* ============================== 1. REGISTRATION ============================== */

const regForm = document.getElementById("form-registration");
document.getElementById("reg-date").value = todayIso();

regForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors(regForm);

  const patientId = regForm.patientId.value.trim();
  const firstName = regForm.firstName.value.trim();
  const lastName = regForm.lastName.value.trim();
  const dob = regForm.dob.value;
  const gender = regForm.gender.value;
  const registrationDate = regForm.registrationDate.value;

  let valid = true;
  if (!patientId) { setFieldError("reg-patientId", "Patient ID is required."); valid = false; }
  else if (state.patients.some((p) => p.patientId === patientId)) {
    setFieldError("reg-patientId", "This patient ID is already registered.");
    valid = false;
  }
  if (!firstName) { setFieldError("reg-firstName", "Required."); valid = false; }
  if (!lastName) { setFieldError("reg-lastName", "Required."); valid = false; }
  if (!dob) { setFieldError("reg-dob", "Required."); valid = false; }
  else if (new Date(dob) > new Date()) { setFieldError("reg-dob", "Date of birth can't be in the future."); valid = false; }
  if (!gender) { setFieldError("reg-gender", "Required."); valid = false; }
  if (!registrationDate) { setFieldError("reg-date", "Required."); valid = false; }
  if (!valid) return;

  const patient = {
    patientId, firstName, lastName, dob, gender, registrationDate,
    vitals: [], visitForms: [],
  };

  try {
    await api.registerPatient(patient);
  } catch (err) {
    showToast("Could not reach the server — saved locally instead.");
    console.error(err);
  }

  state.patients.push(patient);
  activePatientId = patientId;
  saveState();
  markStepComplete("registration");

  document.getElementById("vit-patientName").value = `${firstName} ${lastName}`;
  document.getElementById("vit-visitDate").value = todayIso();
  updatePatientBadge();
  regForm.reset();
  document.getElementById("reg-date").value = todayIso();
  showScreen("vitals");
});

/* ============================== 2. VITALS ============================== */

const vitForm = document.getElementById("form-vitals");
const bmiValueEl = document.getElementById("vit-bmiValue");
const bmiStatusEl = document.getElementById("vit-bmiStatus");

function refreshBmiPreview() {
  const height = parseFloat(vitForm.height.value);
  const weight = parseFloat(vitForm.weight.value);
  if (!height || !weight) {
    bmiValueEl.textContent = "\u2014";
    bmiStatusEl.hidden = true;
    return;
  }
  const bmi = calcBmi(height, weight);
  const status = bmiStatusLabel(bmi);
  bmiValueEl.textContent = bmi.toFixed(1);
  bmiStatusEl.textContent = status;
  bmiStatusEl.className = `status-pill ${statusPillClass(status)}`;
  bmiStatusEl.hidden = false;
}
vitForm.height.addEventListener("input", refreshBmiPreview);
vitForm.weight.addEventListener("input", refreshBmiPreview);

vitForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors(vitForm);

  const patient = getActivePatient();
  if (!patient) { showToast("Register a patient first."); return; }

  const visitDate = vitForm.visitDate.value;
  const height = parseFloat(vitForm.height.value);
  const weight = parseFloat(vitForm.weight.value);

  let valid = true;
  if (!visitDate) { setFieldError("vit-visitDate", "Required."); valid = false; }
  else if (patient.vitals.some((v) => v.visitDate === visitDate)) {
    setFieldError("vit-visitDate", "Vitals were already recorded for this patient on this date.");
    valid = false;
  }
  if (!height) { setFieldError("vit-height", "Required."); valid = false; }
  if (!weight) { setFieldError("vit-weight", "Required."); valid = false; }
  if (!valid) return;

  const bmi = calcBmi(height, weight);
  const vitals = { visitDate, height, weight, bmi };

  try {
    await api.submitVitals({ patientId: patient.patientId, ...vitals });
  } catch (err) {
    showToast("Could not reach the server — saved locally instead.");
    console.error(err);
  }

  patient.vitals.push(vitals);
  pendingVisitDate = visitDate;
  pendingBmi = bmi;
  saveState();
  markStepComplete("vitals");

  const nextScreen = routeForBmi(bmi);
  const prefix = nextScreen === "overweight" ? "ow" : "gen";
  document.getElementById(`${prefix}-patientName`).value = `${patient.firstName} ${patient.lastName}`;
  document.getElementById(`${prefix}-visitDate`).value = visitDate;
  showScreen(nextScreen);
});

/* ============================== 3. ASSESSMENT FORMS ============================== */

function wireAssessmentForm(formId, type) {
  const form = document.getElementById(formId);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(form);

    const patient = getActivePatient();
    if (!patient || !pendingVisitDate) { showToast("Save vitals first."); return; }

    const generalHealth = form.generalHealth.value;
    const extraField = type === "overweight" ? form.dietHistory.value : form.drugUse.value;
    const comments = form.comments.value.trim();
    const extraKey = type === "overweight" ? "ow-dietHistory" : "gen-drugUse";

    let valid = true;
    if (!generalHealth) { setFieldError(`${type === "overweight" ? "ow" : "gen"}-generalHealth`, "Required."); valid = false; }
    if (!extraField) { setFieldError(extraKey, "Required."); valid = false; }
    if (!comments) { setFieldError(`${type === "overweight" ? "ow" : "gen"}-comments`, "Required."); valid = false; }
    if (!valid) return;

    const visitForm = {
      visitDate: pendingVisitDate,
      type,
      generalHealth,
      extra: extraField,
      comments,
      bmiAtVisit: pendingBmi,
    };

    try {
      await api.submitVisitForm({ patientId: patient.patientId, ...visitForm });
    } catch (err) {
      showToast("Could not reach the server — saved locally instead.");
      console.error(err);
    }

    patient.visitForms.push(visitForm);
    saveState();
    markStepComplete("assessment");

    form.reset();
    pendingVisitDate = null;
    pendingBmi = null;
    renderListing();
    showScreen("listing");
    showToast("Assessment saved.");
  });

  form.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const group = radio.name === "generalHealth" ? "generalHealth" : (type === "overweight" ? "dietHistory" : "drugUse");
      const prefix = type === "overweight" ? "ow" : "gen";
      const field = group === "generalHealth" ? `${prefix}-generalHealth` : (type === "overweight" ? "ow-dietHistory" : "gen-drugUse");
      setFieldError(field, "");
    });
  });
}
wireAssessmentForm("form-overweight", "overweight");
wireAssessmentForm("form-general", "general");

/* ============================== 4. PATIENT LISTING ============================== */

const dateFilterEl = document.getElementById("list-dateFilter");
const tbody = document.getElementById("list-tbody");
const emptyState = document.getElementById("list-empty");

function renderListing() {
  const filterDate = dateFilterEl.value;
  const rows = [];

  for (const patient of state.patients) {
    let record = null;

    if (filterDate) {
      record = patient.visitForms.find((f) => f.visitDate === filterDate);
      if (!record) continue;
    } else if (patient.visitForms.length) {
      record = [...patient.visitForms].sort((a, b) => a.visitDate.localeCompare(b.visitDate)).pop();
    }

    rows.push({
      name: `${patient.firstName} ${patient.lastName}`,
      age: calcAge(patient.dob),
      status: record ? bmiStatusLabel(record.bmiAtVisit) : "\u2014",
      lastDate: record ? record.visitDate : "\u2014",
    });
  }

  tbody.innerHTML = "";
  emptyState.hidden = rows.length > 0;

  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.age}</td>
      <td>${row.status === "\u2014" ? row.status : `<span class="status-pill ${statusPillClass(row.status)}">${row.status}</span>`}</td>
      <td>${row.lastDate}</td>
    `;
    tbody.appendChild(tr);
  }
}

dateFilterEl.addEventListener("change", renderListing);
document.getElementById("list-clearFilter").addEventListener("click", () => {
  dateFilterEl.value = "";
  renderListing();
});

/* ============================== INIT ============================== */

showScreen("registration");
renderListing();
