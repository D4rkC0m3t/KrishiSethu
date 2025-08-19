grant select on table "auth"."audit_log_entries" to "anon";

grant select on table "auth"."audit_log_entries" to "authenticated";

grant select on table "auth"."flow_state" to "anon";

grant select on table "auth"."flow_state" to "authenticated";

grant select on table "auth"."identities" to "anon";

grant select on table "auth"."identities" to "authenticated";

grant select on table "auth"."instances" to "anon";

grant select on table "auth"."instances" to "authenticated";

grant select on table "auth"."mfa_amr_claims" to "anon";

grant select on table "auth"."mfa_amr_claims" to "authenticated";

grant select on table "auth"."mfa_challenges" to "anon";

grant select on table "auth"."mfa_challenges" to "authenticated";

grant select on table "auth"."mfa_factors" to "anon";

grant select on table "auth"."mfa_factors" to "authenticated";

grant select on table "auth"."one_time_tokens" to "anon";

grant select on table "auth"."one_time_tokens" to "authenticated";

grant select on table "auth"."refresh_tokens" to "anon";

grant select on table "auth"."refresh_tokens" to "authenticated";

grant select on table "auth"."saml_providers" to "anon";

grant select on table "auth"."saml_providers" to "authenticated";

grant select on table "auth"."saml_relay_states" to "anon";

grant select on table "auth"."saml_relay_states" to "authenticated";

grant select on table "auth"."schema_migrations" to "anon";

grant select on table "auth"."schema_migrations" to "authenticated";

grant select on table "auth"."sessions" to "anon";

grant select on table "auth"."sessions" to "authenticated";

grant select on table "auth"."sso_domains" to "anon";

grant select on table "auth"."sso_domains" to "authenticated";

grant select on table "auth"."sso_providers" to "anon";

grant select on table "auth"."sso_providers" to "authenticated";

grant select on table "auth"."users" to "anon";

grant select on table "auth"."users" to "authenticated";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

revoke select on table "storage"."iceberg_namespaces" from "anon";

revoke select on table "storage"."iceberg_namespaces" from "authenticated";

revoke delete on table "storage"."iceberg_namespaces" from "service_role";

revoke insert on table "storage"."iceberg_namespaces" from "service_role";

revoke references on table "storage"."iceberg_namespaces" from "service_role";

revoke select on table "storage"."iceberg_namespaces" from "service_role";

revoke trigger on table "storage"."iceberg_namespaces" from "service_role";

revoke truncate on table "storage"."iceberg_namespaces" from "service_role";

revoke update on table "storage"."iceberg_namespaces" from "service_role";

revoke select on table "storage"."iceberg_tables" from "anon";

revoke select on table "storage"."iceberg_tables" from "authenticated";

revoke delete on table "storage"."iceberg_tables" from "service_role";

revoke insert on table "storage"."iceberg_tables" from "service_role";

revoke references on table "storage"."iceberg_tables" from "service_role";

revoke select on table "storage"."iceberg_tables" from "service_role";

revoke trigger on table "storage"."iceberg_tables" from "service_role";

revoke truncate on table "storage"."iceberg_tables" from "service_role";

revoke update on table "storage"."iceberg_tables" from "service_role";

alter table "storage"."iceberg_namespaces" drop constraint "iceberg_namespaces_bucket_id_fkey";

alter table "storage"."iceberg_tables" drop constraint "iceberg_tables_bucket_id_fkey";

alter table "storage"."iceberg_tables" drop constraint "iceberg_tables_namespace_id_fkey";

alter table "storage"."iceberg_namespaces" drop constraint "iceberg_namespaces_pkey";

alter table "storage"."iceberg_tables" drop constraint "iceberg_tables_pkey";

drop index if exists "storage"."iceberg_namespaces_pkey";

drop index if exists "storage"."iceberg_tables_pkey";

drop index if exists "storage"."idx_iceberg_namespaces_bucket_id";

drop index if exists "storage"."idx_iceberg_tables_namespace_id";

drop table "storage"."iceberg_namespaces";

drop table "storage"."iceberg_tables";


  create policy " Allow public reads 1ofcemp_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using (true);



  create policy "Allow authenticated deletes 12ehw7u_0"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((auth.role() = 'authenticated'::text));



  create policy "Allow authenticated deletes 16wiy3a_0"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((auth.role() = 'authenticated'::text));



  create policy "Allow authenticated deletes 1ofcemp_0"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((auth.role() = 'authenticated'::text));



  create policy "Allow authenticated updates 12ehw7u_0"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((auth.role() = 'authenticated'::text));



  create policy "Allow authenticated updates 16wiy3a_0"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((auth.role() = 'authenticated'::text));



  create policy "Allow authenticated updates 1ofcemp_0"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((auth.role() = 'authenticated'::text));



  create policy "Allow authenticated uploads 12ehw7u_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((auth.role() = 'authenticated'::text));



  create policy "Allow authenticated uploads 16wiy3a_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((auth.role() = 'authenticated'::text));



  create policy "Allow authenticated uploads 1ofcemp_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((auth.role() = 'authenticated'::text));



  create policy "Allow public reads 12ehw7u_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using (true);



  create policy "Allow public reads 16wiy3a_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using (true);



