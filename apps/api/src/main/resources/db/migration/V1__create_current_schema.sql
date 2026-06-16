create table server_inventory (
    id uuid primary key,
    name varchar(120) not null,
    hostname varchar(253) not null unique,
    ip_address varchar(45) not null,
    description varchar(2000),
    operating_system varchar(120),
    status varchar(16) not null,
    last_seen_at timestamp with time zone,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    constraint chk_server_inventory_status check (status in ('ONLINE', 'OFFLINE', 'UNKNOWN'))
);

create table server_inventory_tags (
    server_inventory_id uuid not null references server_inventory(id) on delete cascade,
    tag varchar(50) not null,
    primary key (server_inventory_id, tag)
);

create table users (
    id uuid primary key,
    email varchar(320) not null unique,
    password_hash varchar(255) not null,
    display_name varchar(120) not null,
    enabled boolean not null default true,
    must_change_password boolean not null default false,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    last_login_at timestamp with time zone
);

create index idx_users_email on users(email);

create table user_permissions (
    user_id uuid not null references users(id) on delete cascade,
    permission varchar(64) not null,
    primary key (user_id, permission)
);

create index idx_user_permissions_user_id on user_permissions(user_id);

create table refresh_tokens (
    id uuid primary key,
    user_id uuid not null references users(id) on delete cascade,
    token_hash varchar(64) not null unique,
    expires_at timestamp with time zone not null,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone not null default current_timestamp
);

create index idx_refresh_tokens_user_id on refresh_tokens(user_id);
create index idx_refresh_tokens_expires_at on refresh_tokens(expires_at);

create table audit_logs (
    id uuid primary key,
    event_type varchar(64) not null,
    aggregate_type varchar(64) not null,
    aggregate_id uuid not null,
    actor varchar(120) not null,
    message varchar(1000) not null,
    metadata jsonb,
    created_at timestamp with time zone not null default current_timestamp
);

create index idx_audit_logs_created_at on audit_logs(created_at desc);
create index idx_audit_logs_aggregate on audit_logs(aggregate_type, aggregate_id);
create index idx_audit_logs_event_type on audit_logs(event_type);

create table agents (
    id uuid primary key,
    name varchar(120) not null,
    hostname varchar(253) not null,
    version varchar(64) not null,
    status varchar(16) not null,
    last_seen_at timestamp with time zone,
    base_url varchar(512) not null,
    shared_secret varchar(512) not null,
    pull_enabled boolean not null default true,
    last_pull_at timestamp with time zone,
    last_successful_pull_at timestamp with time zone,
    last_pull_error varchar(1000),
    capabilities jsonb not null default '[]',
    registered_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    server_id uuid references server_inventory(id) on delete cascade,
    constraint uk_agents_server_id unique (server_id),
    constraint chk_agents_status check (status in ('ONLINE', 'OFFLINE', 'UNKNOWN'))
);

create index idx_agents_status on agents(status);
create index idx_agents_hostname on agents(hostname);
create index idx_agents_last_seen_at on agents(last_seen_at desc);
create index idx_agents_last_successful_pull_at on agents(last_successful_pull_at desc);
create index idx_agents_pull_enabled on agents(pull_enabled);

create table agent_host_facts (
    agent_id uuid primary key,
    hostname varchar(253),
    operating_system varchar(120),
    platform varchar(120),
    kernel_version varchar(120),
    architecture varchar(64),
    cpu_count integer,
    memory_total_bytes bigint,
    disk_total_bytes bigint,
    disk_free_bytes bigint,
    uptime_seconds bigint,
    ip_addresses jsonb,
    agent_version varchar(64),
    collected_at timestamp with time zone,
    updated_at timestamp with time zone not null default current_timestamp,
    constraint fk_agent_host_facts_agent
        foreign key (agent_id) references agents(id) on delete cascade
);

create index idx_agent_host_facts_operating_system on agent_host_facts(operating_system);
create index idx_agent_host_facts_architecture on agent_host_facts(architecture);

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
    ('agents.offline_threshold_seconds', '90', 'INTEGER', 'Seconds without a successful pull before an online agent is marked offline.', 'migration'),
    ('agents.offline_check_interval_seconds', '30', 'INTEGER', 'Seconds between scheduled stale-agent checks. Changes require API restart.', 'migration'),
    ('ui.show_dev_hints', 'true', 'BOOLEAN', 'Show local development hints in the web UI.', 'migration');

create table managed_services (
    id uuid primary key,
    name varchar(120) not null,
    description varchar(2000),
    url varchar(2048),
    hostname varchar(253),
    ip_address varchar(45),
    port integer,
    protocol varchar(16) not null,
    category varchar(32) not null,
    notes varchar(10000),
    server_inventory_id uuid references server_inventory(id) on delete set null,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    constraint chk_managed_services_port check (port is null or (port >= 1 and port <= 65535))
);

create index idx_managed_services_name on managed_services (name);
create index idx_managed_services_category on managed_services (category);
create index idx_managed_services_server_inventory_id on managed_services (server_inventory_id);

create table managed_service_tags (
    managed_service_id uuid not null references managed_services(id) on delete cascade,
    tag varchar(50) not null,
    primary key (managed_service_id, tag)
);

create table notifications (
    id uuid primary key,
    recipient_user_id uuid not null references users(id) on delete cascade,
    title varchar(160) not null,
    message varchar(2000) not null,
    severity varchar(16) not null,
    read_at timestamp with time zone,
    related_resource_type varchar(80),
    related_resource_id varchar(120),
    related_resource_url varchar(500),
    dismissible boolean not null default true,
    dismissed_at timestamp with time zone,
    created_at timestamp with time zone not null
);

create index idx_notifications_recipient_created_at
    on notifications (recipient_user_id, created_at desc);

create index idx_notifications_recipient_unread
    on notifications (recipient_user_id, read_at, dismissed_at);
