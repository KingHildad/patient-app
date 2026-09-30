<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
  $in = json_input();
  foreach (['patientId', 'firstName', 'lastName', 'dob', 'gender', 'registrationDate'] as $field) {
    if (empty($in[$field])) fail("Missing required field: $field");
  }

  $stmt = db()->prepare('SELECT 1 FROM patients WHERE patient_id = ?');
  $stmt->execute([$in['patientId']]);
  if ($stmt->fetch()) fail('Patient ID already registered.', 409);

  $stmt = db()->prepare(
    'INSERT INTO patients (patient_id, first_name, last_name, dob, gender, registration_date)
     VALUES (?, ?, ?, ?, ?, ?)'
  );
  $stmt->execute([
    $in['patientId'], $in['firstName'], $in['lastName'],
    $in['dob'], $in['gender'], $in['registrationDate'],
  ]);

  respond(['patientId' => $in['patientId']], 201);
}

if ($method === 'GET') {
  // Returns each patient plus their most recent visit_form (if any), which
  // is exactly what the listing screen needs — age is computed client-side
  // from dob, so raw dob is returned rather than a precomputed age.
  $sql = "
    SELECT
      p.patient_id, p.first_name, p.last_name, p.dob,
      vf.visit_date AS last_visit_date, vf.bmi_at_visit
    FROM patients p
    LEFT JOIN visit_forms vf ON vf.patient_id = p.patient_id
      AND vf.visit_date = (
        SELECT MAX(visit_date) FROM visit_forms WHERE patient_id = p.patient_id
      )
    ORDER BY p.first_name, p.last_name
  ";
  respond(db()->query($sql)->fetchAll(PDO::FETCH_ASSOC));
}

fail('Method not allowed', 405);
