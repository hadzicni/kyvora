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
