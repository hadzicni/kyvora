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
