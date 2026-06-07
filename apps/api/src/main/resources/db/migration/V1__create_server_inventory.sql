create table server_inventory (
    id uuid primary key,
    name varchar(120) not null,
    hostname varchar(253) not null unique,
    ip_address varchar(45) not null,
    status varchar(16) not null
);
