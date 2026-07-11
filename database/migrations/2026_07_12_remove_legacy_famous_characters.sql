-- Famous Characters are managed by the famous_characters table. Remove records
-- left behind by the retired duplicate siteContent editor.
UPDATE web_settings
SET setting_value = JSON_REMOVE(setting_value, '$.famousCharacters')
WHERE setting_key = 'siteContent'
  AND JSON_VALID(setting_value)
  AND JSON_CONTAINS_PATH(setting_value, 'one', '$.famousCharacters');
