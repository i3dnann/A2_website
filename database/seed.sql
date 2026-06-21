INSERT IGNORE INTO web_roles (id, name, description, is_system, sort_order) VALUES
('role-player', 'Player', 'Default player account.', 1, 100),
('role-support', 'Support', 'Ticket and application support.', 1, 50),
('role-admin', 'Admin', 'Website administrator.', 1, 10),
('role-super-admin', 'Super Admin', 'All non-master admin permissions.', 1, 5),
('role-master-admin', 'Master Admin', 'Full master access.', 1, 1);

INSERT IGNORE INTO web_permissions (id, name, category) VALUES
('perm-view-player-portal', 'view_player_portal', 'player'),
('perm-manage-home', 'manage_home', 'cms'),
('perm-manage-partners', 'manage_partners', 'cms'),
('perm-manage-journey', 'manage_journey', 'cms'),
('perm-manage-famous', 'manage_famous', 'cms'),
('perm-manage-roster', 'manage_roster', 'creators'),
('perm-manage-live', 'manage_live', 'creators'),
('perm-manage-team', 'manage_team', 'cms'),
('perm-manage-careers', 'manage_careers', 'careers'),
('perm-review-career-applications', 'review_career_applications', 'careers'),
('perm-manage-tickets', 'manage_tickets', 'support'),
('perm-close-tickets', 'close_tickets', 'support'),
('perm-manage-news', 'manage_news', 'cms'),
('perm-manage-map', 'manage_map', 'cms'),
('perm-manage-faq', 'manage_faq', 'cms'),
('perm-manage-terms', 'manage_terms', 'legal'),
('perm-manage-events', 'manage_events', 'cms'),
('perm-manage-users', 'manage_users', 'security'),
('perm-manage-admins', 'manage_admins', 'security'),
('perm-manage-permissions', 'manage_permissions', 'security'),
('perm-manage-theme', 'manage_theme', 'cms'),
('perm-manage-webhooks', 'manage_webhooks', 'integrations'),
('perm-view-audit-logs', 'view_audit_logs', 'security'),
('perm-master-access', 'master_access', 'security');

INSERT IGNORE INTO partners (id, partner_name, logo_url, website_url, sort_order, is_visible)
VALUES ('partner-discord', 'A2 Discord', '', 'https://discord.gg/change-me', 1, 1);

INSERT IGNORE INTO journey_items (id, title, description, journey_date, journey_time, status, sort_order, is_visible)
VALUES ('journey-beta', 'Community Beta', 'Creators, staff, and early players shape the city.', '2026-06-21', '20:00', 'current', 1, 1);

INSERT IGNORE INTO famous_characters (id, character_name, header, bio, description, role_name, is_featured, sort_order, is_visible)
VALUES ('famous-demo', 'Maya Knox', 'The first face of A2 Studio', 'Starter famous character.', 'Replace this from the admin panel.', 'Police', 1, 1, 1);

INSERT IGNORE INTO streamers (id, display_name, bio, category, is_featured, is_approved, is_hidden, sort_order)
VALUES ('streamer-demo', 'A2 Creator', 'Add real Twitch/Kick channels from the admin panel.', 'Civilian', 1, 1, 0, 1);

INSERT IGNORE INTO team_members (id, name, role_title, category, bio, sort_order, is_visible)
VALUES ('team-owner', 'A2 Owner', 'Owner', 'Owner', 'Replace this team member in admin.', 1, 1);

INSERT IGNORE INTO career_jobs (id, title, description, department, is_open, start_date, requirements, sort_order, is_visible)
VALUES ('career-police', 'Police Department', 'Apply to patrol, investigate, and protect A2 Studio.', 'Law Enforcement', 1, '2026-06-21', 'Mature RP, microphone, interview.', 1, 1);

INSERT IGNORE INTO faq_categories (id, name, description, sort_order, is_visible)
VALUES ('faq-general', 'General', 'Common community questions.', 1, 1);

INSERT IGNORE INTO faq_items (id, category_id, question, answer, sort_order, is_visible)
VALUES ('faq-steam', 'faq-general', 'Why do I need Steam linked?', 'Steam is used to safely match your website account with your own FiveM characters.', 1, 1);

INSERT IGNORE INTO terms_pages (id, title, content, version, effective_date, is_visible, sort_order)
VALUES ('terms-default', 'A2 Studio Terms', 'Respect staff, players, and roleplay. Edit these terms from the admin panel.', '1.0.0', '2026-06-21', 1, 1);

INSERT IGNORE INTO news_categories (id, name, slug, description, sort_order, is_visible)
VALUES ('news-community', 'Community', 'community', 'Community updates.', 1, 1);

INSERT IGNORE INTO news_articles (id, title, subtitle, content, category, author_name, published_at, status, is_featured, sort_order)
VALUES ('news-launch', 'A2 Studio Website Launch', 'A new home for the community.', 'Manage news from the admin panel.', 'Community', 'A2 Studio', NOW(), 'Published', 1, 1);

INSERT IGNORE INTO map_zones (id, zone_name, zone_type, description, position_x, position_y, color, icon, sort_order, is_visible)
VALUES ('zone-legion', 'Legion Square', 'Safe zone', 'Public meet-up and safe roleplay space.', 48, 52, '#35ff6b', 'shield', 1, 1);

INSERT IGNORE INTO events (id, title, description, location, starts_at, ends_at, category, sort_order, is_visible)
VALUES ('event-opening', 'Opening Night', 'Community gathering and city photos.', 'Legion Square', DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY + INTERVAL 2 HOUR), 'Community', 1, 1);
