create table users (
    id uuid primary key,
    email varchar(320) not null unique,
    password_hash varchar(255) not null,
    display_name varchar(120) not null,
    role varchar(32) not null,
    enabled boolean not null default true,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);

create index idx_users_email on users(email);
