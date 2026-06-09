alter table users
    add column must_change_password boolean not null default false;
