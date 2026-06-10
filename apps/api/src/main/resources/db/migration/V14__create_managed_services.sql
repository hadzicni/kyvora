create table managed_services (
    id uuid primary key,
    name varchar(120) not null,
    description varchar(2000),
    url varchar(2048),
    hostname varchar(253),
    ip_address varchar(45),
    port integer,
    protocol varchar(16) not null,
    category varchar(32) not null,
    notes varchar(10000),
    server_inventory_id uuid references server_inventory(id) on delete set null,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    constraint chk_managed_services_port check (port is null or (port >= 1 and port <= 65535))
);

create index idx_managed_services_name on managed_services (name);
create index idx_managed_services_category on managed_services (category);
create index idx_managed_services_server_inventory_id on managed_services (server_inventory_id);

create table managed_service_tags (
    managed_service_id uuid not null references managed_services(id) on delete cascade,
    tag varchar(50) not null,
    primary key (managed_service_id, tag)
);
