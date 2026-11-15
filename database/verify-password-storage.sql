-- Select the intended database first. This query does not change credentials.
SELECT idusers, email,
       password LIKE '$argon2id$%' AS argon2id_format,
       CASE WHEN password LIKE '$argon2id$%'
         THEN SUBSTRING_INDEX(SUBSTRING_INDEX(password, '$', 5), '$', -1)
         ELSE NULL END AS salt_base64
FROM users
ORDER BY idusers;

SELECT COUNT(*) AS credentials_without_argon2id_prefix
FROM users
WHERE password NOT LIKE '$argon2id$%';
-- Prefix checks are an inspection aid; login and automated tests verify hashes.
