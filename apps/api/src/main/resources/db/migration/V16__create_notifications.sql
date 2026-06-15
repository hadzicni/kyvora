CREATE TABLE notifications (
	id UUID PRIMARY KEY,
	recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	title VARCHAR(160) NOT NULL,
	message VARCHAR(2000) NOT NULL,
	severity VARCHAR(16) NOT NULL,
	read_at TIMESTAMP WITH TIME ZONE,
	related_resource_type VARCHAR(80),
	related_resource_id VARCHAR(120),
	related_resource_url VARCHAR(500),
	dismissible BOOLEAN NOT NULL DEFAULT TRUE,
	dismissed_at TIMESTAMP WITH TIME ZONE,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_notifications_recipient_created_at
	ON notifications (recipient_user_id, created_at DESC);

CREATE INDEX idx_notifications_recipient_unread
	ON notifications (recipient_user_id, read_at, dismissed_at);
