alter table agents
    drop constraint uk_agents_hostname;

alter table agents
    drop constraint chk_agents_status;

alter table agents
    add constraint chk_agents_status
        check (status in ('PENDING', 'ONLINE', 'OFFLINE', 'UNKNOWN', 'DECOMMISSIONED'));

create index idx_agents_hostname on agents(hostname);
