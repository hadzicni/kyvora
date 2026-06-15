delete from user_permissions
where permission in ('AGENT_CANCEL_ENROLLMENT', 'AGENT_ROTATE_TOKEN');

insert into user_permissions (user_id, permission)
select distinct user_id, 'AGENT_PULL'
from user_permissions
where permission in ('AGENT_ENROLL', 'AGENT_DECOMMISSION')
  and not exists (
      select 1
      from user_permissions existing
      where existing.user_id = user_permissions.user_id
        and existing.permission = 'AGENT_PULL'
  );

alter table agents
    drop constraint if exists chk_agents_status;

alter table agents
    drop column if exists token_hash;

alter table agents
    drop column if exists token_created_at;

alter table agents
    drop column if exists token_last_used_at;

alter table agents
    drop column if exists token_revoked_at;

drop index if exists idx_agents_token_revoked_at;

alter table agents
    add column base_url varchar(512);

alter table agents
    add column shared_secret varchar(512);

alter table agents
    add column pull_enabled boolean not null default true;

alter table agents
    add column last_pull_at timestamp with time zone;

alter table agents
    add column last_successful_pull_at timestamp with time zone;

alter table agents
    add column last_pull_error varchar(1000);

alter table agents
    add column capabilities jsonb not null default '[]';

update agents
set status = 'UNKNOWN'
where status in ('PENDING', 'DECOMMISSIONED');

update agents
set base_url = 'http://' || hostname || ':9288'
where base_url is null;

update agents
set shared_secret = 'replace-me'
where shared_secret is null;

alter table agents
    alter column base_url set not null;

alter table agents
    alter column shared_secret set not null;

alter table agents
    add constraint chk_agents_status
        check (status in ('ONLINE', 'OFFLINE', 'UNKNOWN'));

create index idx_agents_last_successful_pull_at on agents(last_successful_pull_at desc);
create index idx_agents_pull_enabled on agents(pull_enabled);
