create table agents (
    id uuid primary key,
    name varchar(120) not null,
    hostname varchar(253) not null,
    version varchar(64) not null,
    status varchar(16) not null,
    last_seen_at timestamp with time zone,
    registered_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    constraint uk_agents_hostname unique (hostname),
    constraint chk_agents_status check (status in ('PENDING', 'ONLINE', 'OFFLINE', 'UNKNOWN'))
);

create index idx_agents_status on agents(status);
create index idx_agents_last_seen_at on agents(last_seen_at desc);
