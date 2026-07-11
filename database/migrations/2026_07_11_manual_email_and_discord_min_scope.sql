-- Discord OAuth no longer requests email. Allow OAuth users to have NULL email
-- until they manually add one from the website account page.

SET NAMES utf8mb4;

UPDATE web_users SET email = NULL WHERE email = '';

DROP PROCEDURE IF EXISTS a2_modify_col;
DELIMITER //
CREATE PROCEDURE a2_modify_col(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition TEXT)
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_column
  ) THEN
    SET @a2_sql = CONCAT('ALTER TABLE `', p_table, '` MODIFY COLUMN ', p_definition);
    PREPARE a2_stmt FROM @a2_sql;
    EXECUTE a2_stmt;
    DEALLOCATE PREPARE a2_stmt;
  END IF;
END//
DELIMITER ;

CALL a2_modify_col('web_users', 'email', 'email VARCHAR(190) NULL');

DROP PROCEDURE IF EXISTS a2_modify_col;
