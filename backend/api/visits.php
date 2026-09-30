<?php
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);

$in = json_input();
foreach (['patientId', 'visitDate', 'type', 'generalHealth', 'extra', 'comments', 'bmiAtVisit'] as $field) {
  if (!isset($in[$field]) || $in[$field] === '') fail("Missing required field: $field");
}
if (!in_array($in['type'], ['general', 'overweight'], true)) fail('type must be "general" or "overweight".');

$stmt = db()->prepare('SELECT 1 FROM patients WHERE patient_id = ?');
$stmt->execute([$in['patientId']]);
if (!$stmt->fetch()) fail('Unknown patient_id.', 404);

try {
  $stmt = db()->prepare(
    'INSERT INTO visit_forms (patient_id, visit_date, form_type, general_health, extra_field, comments, bmi_at_visit)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  $stmt->execute([
    $in['patientId'], $in['visitDate'], $in['type'],
    $in['generalHealth'], $in['extra'], $in['comments'], $in['bmiAtVisit'],
  ]);
} catch (PDOException $e) {
  if ($e->getCode() === '23000') fail('An assessment already exists for this patient on this date.', 409);
  throw $e;
}

respond(['id' => db()->lastInsertId()], 201);
