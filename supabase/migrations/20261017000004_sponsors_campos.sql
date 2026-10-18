-- El formulario de /sponsors recoge más datos de los que tenía la tabla
-- (apellido del contacto y tres redes sociales). Se agregan para no perderlos.

alter table sponsors add column if not exists contact_lastname text;
alter table sponsors add column if not exists linkedin         text;
alter table sponsors add column if not exists instagram        text;
alter table sponsors add column if not exists facebook         text;

-- El teléfono se llamaba `phone`; el formulario lo manda como contact_phone.
-- Se deja `phone` como nombre único para no tener dos columnas con lo mismo.
comment on column sponsors.phone is 'Teléfono del contacto (contact_phone en el formulario)';

-- Un mismo correo no debería postular dos veces con el mismo plan.
create unique index if not exists sponsors_email_plan_key
  on sponsors (lower(email), coalesce(plan, ''));
