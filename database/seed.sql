INSERT IGNORE INTO web_roles (id, name, description, is_system, sort_order) VALUES
('role-master', 'Master Admin', 'Full dangerous access. Only this role can remove blacklists and change master-only settings.', 1, 1),
('role-admin', 'Admin', 'Website administrator.', 1, 2),
('role-staff', 'Staff', 'Support, whitelist, tickets, and appeals.', 1, 3),
('role-player', 'Player', 'Default logged-in player.', 1, 100);

INSERT IGNORE INTO web_permissions (id, name, category) VALUES
('perm-master', 'master_access', 'security'),
('perm-portal', 'view_player_portal', 'player'),
('perm-staff', 'use_staff_panel', 'staff'),
('perm-settings', 'edit_website_settings', 'admin'),
('perm-streamers', 'manage_streamers', 'streamers'),
('perm-view-streamers', 'view_streamers', 'streamers'),
('perm-police', 'view_police_panel', 'police'),
('perm-ems', 'view_ems_panel', 'ems'),
('perm-court', 'view_court_panel', 'court'),
('perm-tickets', 'review_tickets', 'support'),
('perm-appeals', 'review_ban_appeals', 'support'),
('perm-whitelist', 'review_whitelist', 'support');

INSERT IGNORE INTO news_articles (id, title, subtitle, category, author_name, language, status, content, is_featured, sort_order)
VALUES ('news-1', 'A2 Studio City Hall Opens', 'The city control center is ready.', 'Server updates', 'City Desk', 'en', 'Published', 'Welcome to A2 Studio. Replace this article in the admin CMS.', 1, 1);

INSERT IGNORE INTO streamers (id, display_name, main_platform, category, bio, is_featured, is_approved, is_hidden, sort_order)
VALUES ('streamer-1', 'A2 Creator', 'Twitch', 'Civilian', 'Demo creator profile. Add real Twitch or Kick channels from the staff panel.', 1, 1, 0, 1);
