DROP PROCEDURE IF EXISTS a2_add_col;
DELIMITER //
CREATE PROCEDURE a2_add_col(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition TEXT)
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = p_table
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_column
  ) THEN
    SET @a2_sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN ', p_definition);
    PREPARE a2_stmt FROM @a2_sql;
    EXECUTE a2_stmt;
    DEALLOCATE PREPARE a2_stmt;
  END IF;
END//
DELIMITER ;

CALL a2_add_col('news_articles', 'video_url', 'video_url TEXT AFTER image_url');

DROP PROCEDURE IF EXISTS a2_add_col;
