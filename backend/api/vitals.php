<?php
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Method not allowed', 405);

$in = json_input();
foreach (['patientId', 'visitDate', 'height', 'weight'] as $field) {
  if (empty($in[$field]) && $in[$field] !== 0) fail("Missing required field: $field");
}

$stmt = db()->prepare('SELECT 1 FROM patients WHERE patient_id = ?');
$stmt->execute([$in['patientId']]);
if (!$stmt->fetch()) fail('Unknown patient_id.', 404);

$height = (float) $in['height'];
$weight = (float) $in['weight'];
$bmi = round($weight / (($height / 100) ** 2), 2);

try {
  $stmt = db()->prepare(
    'INSERT INTO vitals (patient_id, visit_date, height_cm, weight_kg, bmi)
     VALUES (?, ?, ?, ?, ?)'
  );
  $stmt->execute([$in['patientId'], $in['visitDate'], $height, $weight, $bmi]);
} catch (PDOException $e) {
  if ($e->getCode() === '23000') fail('Vitals already recorded for this patient on this date.', 409);
  throw $e;
}

respond(['bmi' => $bmi], 201);
