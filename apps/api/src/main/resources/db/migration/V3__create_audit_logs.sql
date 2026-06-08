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
