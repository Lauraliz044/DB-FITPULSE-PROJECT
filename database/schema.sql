CREATE TABLE IF NOT EXISTS users (
  idusers INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(45) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'client',
  status VARCHAR(10) NOT NULL DEFAULT 'active',
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT chk_user_role CHECK (role IN ('client', 'admin')),
  CONSTRAINT chk_user_status CHECK (status IN ('active', 'inactive'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS scheduled_classes (
  idscheduled_classes INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(45) NOT NULL,
  instructor_name VARCHAR(45) NOT NULL,
  category VARCHAR(45) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  capacity INT NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  description TEXT NOT NULL,
  CONSTRAINT chk_class_capacity CHECK (capacity > 0),
  CONSTRAINT chk_class_price CHECK (price >= 0),
  CONSTRAINT chk_class_schedule CHECK (ends_at > starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS packages (
  idpackages INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(45) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  class_quantity INT NOT NULL,
  description TEXT NOT NULL,
  CONSTRAINT chk_package_quantity CHECK (class_quantity > 0),
  CONSTRAINT chk_package_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS purchases (
  idpurchase INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  paid_price DECIMAL(10,2) NOT NULL,
  purchased_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idusers INT NOT NULL,
  idpackages INT NOT NULL,
  CONSTRAINT fk_purchases_user FOREIGN KEY (idusers) REFERENCES users(idusers),
  CONSTRAINT fk_purchases_package FOREIGN KEY (idpackages) REFERENCES packages(idpackages),
  CONSTRAINT chk_paid_price CHECK (paid_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reservations (
  idreservation INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  class_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(10) NOT NULL DEFAULT 'reserved',
  CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users(idusers),
  CONSTRAINT fk_reservations_class FOREIGN KEY (class_id) REFERENCES scheduled_classes(idscheduled_classes),
  CONSTRAINT uq_reservation_user_class UNIQUE (user_id, class_id),
  CONSTRAINT chk_reservation_status CHECK (status IN ('reserved', 'attended', 'no_show'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reviews (
  idreview INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  rating TINYINT NOT NULL,
  comment TEXT NULL,
  tags JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  iduser INT NOT NULL,
  idclass INT NOT NULL,
  intensity VARCHAR(10) NULL,
  CONSTRAINT fk_reviews_user FOREIGN KEY (iduser) REFERENCES users(idusers),
  CONSTRAINT fk_reviews_class FOREIGN KEY (idclass) REFERENCES scheduled_classes(idscheduled_classes),
  CONSTRAINT uq_review_user_class UNIQUE (iduser, idclass),
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT chk_intensity CHECK (intensity IS NULL OR intensity IN ('low', 'moderate', 'high')),
  CONSTRAINT chk_tags_array CHECK (JSON_TYPE(tags) = 'ARRAY')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS personal_records (
  idrecord INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  exercise VARCHAR(120) NOT NULL,
  record_type VARCHAR(45) NOT NULL,
  value DECIMAL(12,3) NOT NULL,
  unit VARCHAR(45) NOT NULL,
  achieved_on DATE NOT NULL,
  CONSTRAINT fk_records_user FOREIGN KEY (user_id) REFERENCES users(idusers),
  CONSTRAINT chk_record_value CHECK (value > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
