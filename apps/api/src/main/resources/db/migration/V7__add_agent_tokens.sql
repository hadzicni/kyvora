alter table agents
    add column token_hash varchar(64);

alter table agents
    add column token_created_at timestamp with time zone;

alter table agents
    add column token_last_used_at timestamp with time zone;

alter table agents
    add column token_revoked_at timestamp with time zone;

create index idx_agents_token_revoked_at on agents(token_revoked_at);
