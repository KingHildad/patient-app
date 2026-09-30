-- Run this once in phpMyAdmin (or `mysql -u root patient_app < schema.sql`)
-- to create the tables this API expects.

CREATE DATABASE IF NOT EXISTS patient_app;
USE patient_app;

CREATE TABLE IF NOT EXISTS patients (
  patient_id        VARCHAR(50)  NOT NULL PRIMARY KEY,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  dob               DATE         NOT NULL,
  gender             ENUM('Male','Female') NOT NULL,
  registration_date DATE         NOT NULL,
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vitals (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  patient_id  VARCHAR(50) NOT NULL,
  visit_date  DATE        NOT NULL,
  height_cm   DECIMAL(5,1) NOT NULL,
  weight_kg   DECIMAL(5,1) NOT NULL,
  bmi         DECIMAL(5,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  UNIQUE KEY uniq_patient_visit (patient_id, visit_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS visit_forms (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  patient_id      VARCHAR(50) NOT NULL,
  visit_date      DATE        NOT NULL,
  form_type       ENUM('general','overweight') NOT NULL,
  general_health  ENUM('Good','Poor') NOT NULL,
  extra_field     ENUM('Yes','No') NOT NULL, -- diet history (overweight) or drug use (general)
  comments        TEXT NOT NULL,
  bmi_at_visit    DECIMAL(5,2) NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  UNIQUE KEY uniq_patient_form_visit (patient_id, visit_date)
) ENGINE=InnoDB;
