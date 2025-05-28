-- Seed Data for Content Approval System
-- This script populates the database with initial data for development/testing

-- Insert default settings
INSERT INTO settings (key, value) VALUES
('allowed_domains', '["example.com", "yourcompany.com"]'),
('require_ceo_approval', 'true'),
('require_coo_approval', 'true'),
('require_cmo_approval', 'true'),
('auto_approval_hours', '48'),
('enable_cmo_override', 'true');

-- Insert sample users
INSERT INTO users (id, name, email, role, approver_role, notification_preferences) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John CEO', 'ceo@example.com', 'approver', 'ceo', '{"receiveInAppNewSubmissions": true, "receiveInAppApprovalDecisions": true, "receiveEmailNotifications": true, "receiveDailyDigest": true}'),
('550e8400-e29b-41d4-a716-446655440002', 'Jane COO', 'coo@example.com', 'approver', 'coo', '{"receiveInAppNewSubmissions": true, "receiveInAppApprovalDecisions": true, "receiveEmailNotifications": true, "receiveDailyDigest": false}'),
('550e8400-e29b-41d4-a716-446655440003', 'Bob CMO', 'cmo@example.com', 'approver', 'cmo', '{"receiveInAppNewSubmissions": true, "receiveInAppApprovalDecisions": true, "receiveEmailNotifications": false, "receiveDailyDigest": true}'),
('550e8400-e29b-41d4-a716-446655440004', 'Alice Writer', 'alice@example.com', 'writer', null, '{"receiveInAppNewSubmissions": false, "receiveInAppApprovalDecisions": true, "receiveEmailNotifications": true, "receiveDailyDigest": false}'),
('550e8400-e29b-41d4-a716-446655440005', 'Admin User', 'admin@example.com', 'admin', null, '{"receiveInAppNewSubmissions": true, "receiveInAppApprovalDecisions": true, "receiveEmailNotifications": true, "receiveDailyDigest": true}');

-- Insert sample tags
INSERT INTO tags (id, name) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Product Launch'),
('650e8400-e29b-41d4-a716-446655440002', 'Social Media'),
('650e8400-e29b-41d4-a716-446655440003', 'Email Campaign'),
('650e8400-e29b-41d4-a716-446655440004', 'Blog Post'),
('650e8400-e29b-41d4-a716-446655440005', 'Press Release');

-- Insert sample releases
INSERT INTO releases (id, name, start_date, end_date) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'Q1 2024 Launch', '2024-01-01', '2024-03-31'),
('750e8400-e29b-41d4-a716-446655440002', 'Summer Campaign', '2024-06-01', '2024-08-31'),
('750e8400-e29b-41d4-a716-446655440003', 'Holiday Season', '2024-11-01', '2024-12-31');

-- Insert sample posts
INSERT INTO posts (id, title, briefing, publish_date, status, created_by_id, release_id) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'New Product Announcement', 'We are launching our revolutionary new product that will change the industry. This post should highlight key features and benefits.', '2024-02-15', 'draft', '550e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440001'),
('850e8400-e29b-41d4-a716-446655440002', 'Customer Success Story', 'Feature story about how our product helped a major client achieve their goals. Include testimonials and metrics.', '2024-02-20', 'in_approval', '550e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440001'),
('850e8400-e29b-41d4-a716-446655440003', 'Summer Sale Campaign', 'Promotional content for our summer sale event. Include discount details and call-to-action.', '2024-06-15', 'approved', '550e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440002');

-- Insert sample cards
INSERT INTO cards (id, "order", post_id) VALUES
('950e8400-e29b-41d4-a716-446655440001', 1, '850e8400-e29b-41d4-a716-446655440001'),
('950e8400-e29b-41d4-a716-446655440002', 2, '850e8400-e29b-41d4-a716-446655440001'),
('950e8400-e29b-41d4-a716-446655440003', 1, '850e8400-e29b-41d4-a716-446655440002'),
('950e8400-e29b-41d4-a716-446655440004', 1, '850e8400-e29b-41d4-a716-446655440003');

-- Insert sample card versions
INSERT INTO card_versions (id, version_number, text_main, text_art, explanation_for_designer, card_id, created_by_id) VALUES
('a50e8400-e29b-41d4-a716-446655440001', 1, 'Introducing our game-changing product that revolutionizes the way you work!', 'Revolutionary Product Launch', 'Use bold, modern fonts with our brand colors. Include product image.', '950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004'),
('a50e8400-e29b-41d4-a716-446655440002', 1, 'Key features: Advanced AI, Cloud Integration, Mobile-First Design', 'Key Features Highlight', 'Create an infographic showing the three main features with icons.', '950e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004'),
('a50e8400-e29b-41d4-a716-446655440003', 1, 'XYZ Corp increased productivity by 300% using our solution', 'Customer Success', 'Use customer logo and include testimonial quote in speech bubble.', '950e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004'),
('a50e8400-e29b-41d4-a716-446655440004', 1, 'Limited time offer: 30% off for the first 100 customers!', 'Summer Sale 30% Off', 'Bright summer colors, countdown timer visual, call-to-action button.', '950e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004');

-- Insert post-tag relationships
INSERT INTO posts_tags (post_id, tag_id) VALUES
('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001'),
('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002'),
('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440004'),
('850e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002'),
('850e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003');

-- Insert sample approvals
INSERT INTO approvals (id, post_id, user_id, role, status, comment) VALUES
('b50e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'ceo', 'approved', 'Looks great! Ready for publication.'),
('b50e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'coo', 'pending', null),
('b50e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'cmo', 'pending', null),
('b50e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'ceo', 'approved', 'Excellent campaign concept.'),
('b50e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'coo', 'approved', 'Budget approved.'),
('b50e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'cmo', 'approved', 'Perfect timing for summer season.');

-- Insert sample audit logs
INSERT INTO audit_logs (id, post_id, user_id, action, details) VALUES
('c50e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'create', 'Post created'),
('c50e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'create', 'Post created'),
('c50e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'submit', 'Post submitted for approval'),
('c50e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'approve', 'CEO approval granted'),
('c50e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'create', 'Post created'),
('c50e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'approve', 'CEO approval granted'),
('c50e8400-e29b-41d4-a716-446655440007', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'approve', 'COO approval granted'),
('c50e8400-e29b-41d4-a716-446655440008', '850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'approve', 'CMO approval granted');

-- Insert sample notifications
INSERT INTO notifications (id, user_id, type, title, message, post_id) VALUES
('d50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'post_submitted', 'New Post Awaiting Approval', 'Customer Success Story has been submitted for your approval.', '850e8400-e29b-41d4-a716-446655440002'),
('d50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'post_submitted', 'New Post Awaiting Approval', 'Customer Success Story has been submitted for your approval.', '850e8400-e29b-41d4-a716-446655440002'),
('d50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'post_submitted', 'New Post Awaiting Approval', 'Customer Success Story has been submitted for your approval.', '850e8400-e29b-41d4-a716-446655440002'),
('d50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'post_approved', 'Post Approved', 'Your post "Summer Sale Campaign" has been approved by all reviewers.', '850e8400-e29b-41d4-a716-446655440003');