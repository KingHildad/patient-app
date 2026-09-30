<?php
/**
 * Shared setup: CORS headers, JSON helpers, and the PDO connection.
 * Every endpoint file in api/ requires this first.
 *
 * XAMPP defaults assumed: host localhost, user root, no password.
 * Change DB_* below only if your XAMPP MySQL is configured differently.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'patient_app');
define('DB_USER', 'root');
define('DB_PASS', '');

// --- CORS: allow the frontend (served separately, e.g. via VS Code Live
// Server on a different port) to call this API during development. ---
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function json_input(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function respond($data, int $status = 200): void {
  http_response_code($status);
  echo json_encode($data);
  exit;
}

function fail(string $message, int $status = 400): void {
  respond(['error' => $message], $status);
}

function db(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    try {
      $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
      );
    } catch (PDOException $e) {
      fail('Database connection failed: ' . $e->getMessage(), 500);
    }
  }
  return $pdo;
}
