create table system_settings (
    "key" varchar(120) primary key,
    "value" text not null,
    value_type varchar(32),
    description text,
    updated_at timestamp with time zone not null default current_timestamp,
    updated_by varchar(120)
);

insert into system_settings ("key", "value", value_type, description, updated_by)
values
    ('instance.name', 'Kyvora', 'STRING', 'Display name for this Kyvora instance.', 'migration'),
    ('instance.description', 'Homelab Control Plane', 'STRING', 'Short description shown in the UI.', 'migration'),
    ('agents.offline_threshold_seconds', '90', 'INTEGER', 'Seconds without a heartbeat before an online agent is marked offline.', 'migration'),
    ('agents.offline_check_interval_seconds', '30', 'INTEGER', 'Seconds between scheduled stale-agent checks. Changes require API restart.', 'migration'),
    ('ui.show_dev_hints', 'true', 'BOOLEAN', 'Show local development hints in the web UI.', 'migration');
