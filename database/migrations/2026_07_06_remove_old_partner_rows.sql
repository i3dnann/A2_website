DELETE FROM partners
WHERE LOWER(COALESCE(partner_name, '')) LIKE '%zerotrust%'
   OR LOWER(COALESCE(logo_url, '')) LIKE '%zerotrust%'
   OR LOWER(COALESCE(website_url, '')) LIKE '%zerotrust%';
