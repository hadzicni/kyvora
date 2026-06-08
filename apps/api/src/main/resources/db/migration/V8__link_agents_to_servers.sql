alter table agents
    add column server_id uuid;

alter table agents
    add constraint fk_agents_server_inventory
        foreign key (server_id) references server_inventory(id) on delete cascade;

alter table agents
    add constraint uk_agents_server_id unique (server_id);
