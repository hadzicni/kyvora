alter table server_inventory
    add column description varchar(2000);

alter table server_inventory
    add column operating_system varchar(120);

alter table server_inventory
    add column last_seen_at timestamp with time zone;

alter table server_inventory
    add column created_at timestamp with time zone not null default current_timestamp;

alter table server_inventory
    add column updated_at timestamp with time zone not null default current_timestamp;

create table server_inventory_tags (
    server_inventory_id uuid not null references server_inventory(id) on delete cascade,
    tag varchar(50) not null,
    primary key (server_inventory_id, tag)
);
