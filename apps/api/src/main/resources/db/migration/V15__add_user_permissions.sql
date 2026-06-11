create table user_permissions (
    user_id uuid not null references users(id) on delete cascade,
    permission varchar(64) not null,
    primary key (user_id, permission)
);

insert into user_permissions (user_id, permission)
select id, 'DASHBOARD_READ'
from users
where role in ('ADMIN', 'OPERATOR', 'VIEWER');

insert into user_permissions (user_id, permission)
select id, 'AUDIT_LOG_READ'
from users
where role in ('ADMIN', 'OPERATOR', 'VIEWER');

insert into user_permissions (user_id, permission)
select id, 'NETWORK_MAP_READ'
from users
where role in ('ADMIN', 'OPERATOR', 'VIEWER');

insert into user_permissions (user_id, permission)
select id, 'USER_READ'
from users
where role = 'ADMIN';

insert into user_permissions (user_id, permission)
select id, 'USER_CREATE'
from users
where role = 'ADMIN';

insert into user_permissions (user_id, permission)
select id, 'USER_UPDATE'
from users
where role = 'ADMIN';

insert into user_permissions (user_id, permission)
select id, 'USER_DISABLE'
from users
where role = 'ADMIN';

insert into user_permissions (user_id, permission)
select id, 'USER_ENABLE'
from users
where role = 'ADMIN';

insert into user_permissions (user_id, permission)
select id, 'USER_PASSWORD_RESET'
from users
where role = 'ADMIN';

insert into user_permissions (user_id, permission)
select id, 'SETTINGS_READ'
from users
where role = 'ADMIN';

insert into user_permissions (user_id, permission)
select id, 'SETTINGS_UPDATE'
from users
where role = 'ADMIN';

insert into user_permissions (user_id, permission)
select id, 'SERVER_READ'
from users
where role in ('ADMIN', 'OPERATOR', 'VIEWER');

insert into user_permissions (user_id, permission)
select id, 'SERVER_CREATE'
from users
where role in ('ADMIN', 'OPERATOR');

insert into user_permissions (user_id, permission)
select id, 'SERVER_UPDATE'
from users
where role in ('ADMIN', 'OPERATOR');

insert into user_permissions (user_id, permission)
select id, 'SERVER_DELETE'
from users
where role = 'ADMIN';

insert into user_permissions (user_id, permission)
select id, 'SERVICE_READ'
from users
where role in ('ADMIN', 'OPERATOR', 'VIEWER');

insert into user_permissions (user_id, permission)
select id, 'SERVICE_CREATE'
from users
where role in ('ADMIN', 'OPERATOR');

insert into user_permissions (user_id, permission)
select id, 'SERVICE_UPDATE'
from users
where role in ('ADMIN', 'OPERATOR');

insert into user_permissions (user_id, permission)
select id, 'SERVICE_DELETE'
from users
where role in ('ADMIN', 'OPERATOR');

insert into user_permissions (user_id, permission)
select id, 'AGENT_READ'
from users
where role in ('ADMIN', 'OPERATOR', 'VIEWER');

insert into user_permissions (user_id, permission)
select id, 'AGENT_ENROLL'
from users
where role in ('ADMIN', 'OPERATOR');

insert into user_permissions (user_id, permission)
select id, 'AGENT_CANCEL_ENROLLMENT'
from users
where role in ('ADMIN', 'OPERATOR');

insert into user_permissions (user_id, permission)
select id, 'AGENT_ROTATE_TOKEN'
from users
where role in ('ADMIN', 'OPERATOR');

insert into user_permissions (user_id, permission)
select id, 'AGENT_DECOMMISSION'
from users
where role in ('ADMIN', 'OPERATOR');

create index idx_user_permissions_user_id on user_permissions(user_id);

alter table users alter column role drop not null;
