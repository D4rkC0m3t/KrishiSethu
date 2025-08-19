drop extension if exists "pg_net";

create type "public"."movement_type" as enum ('purchase', 'sale', 'adjustment', 'return', 'transfer', 'damage', 'expired');

create type "public"."payment_method" as enum ('cash', 'card', 'upi', 'bank_transfer', 'cheque', 'credit');

create type "public"."payment_status" as enum ('pending', 'partial', 'completed', 'overdue', 'cancelled');

create type "public"."product_type" as enum ('Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools');

create type "public"."transaction_status" as enum ('draft', 'pending', 'completed', 'cancelled', 'returned');

create type "public"."user_role" as enum ('admin', 'manager', 'staff', 'viewer');

create sequence "public"."product_code_seq";

create sequence "public"."purchase_number_seq";

create sequence "public"."sale_number_seq";


  create table "public"."admin_actions" (
    "id" uuid not null default uuid_generate_v4(),
    "admin_id" uuid,
    "target_user_id" uuid,
    "action_type" text not null,
    "action_details" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."admin_actions" enable row level security;


  create table "public"."brands" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."categories" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "is_active" boolean default true,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."customers" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "phone" text,
    "email" text,
    "address" jsonb,
    "gst_number" text,
    "credit_limit" numeric(12,2) default 0,
    "outstanding_amount" numeric(12,2) default 0,
    "total_purchases" numeric(12,2) default 0,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."notification_logs" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "notification_type" text not null,
    "message" text not null,
    "sent_at" timestamp with time zone default now(),
    "delivery_status" text default 'sent'::text,
    "email_sent" boolean default false,
    "sms_sent" boolean default false
      );


alter table "public"."notification_logs" enable row level security;


  create table "public"."products" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "code" text,
    "type" product_type default 'Chemical'::product_type,
    "category_id" uuid,
    "brand_id" uuid,
    "supplier_id" uuid,
    "description" text,
    "composition" jsonb,
    "quantity" numeric(10,2) default 0,
    "unit" text default 'kg'::text,
    "min_stock_level" numeric(10,2) default 0,
    "reorder_point" numeric(10,2) default 0,
    "purchase_price" numeric(10,2) default 0,
    "sale_price" numeric(10,2) default 0,
    "mrp" numeric(10,2) default 0,
    "batch_no" text,
    "expiry_date" date,
    "manufacturing_date" date,
    "hsn_code" text default '31051000'::text,
    "gst_rate" numeric(5,2) default 5.00,
    "barcode" text,
    "location" text,
    "image_urls" text[],
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "attachments" jsonb default '[]'::jsonb
      );



  create table "public"."profiles" (
    "id" uuid not null,
    "name" text not null,
    "email" text not null,
    "phone" text,
    "company_name" text,
    "trial_start" timestamp with time zone default now(),
    "trial_end" timestamp with time zone default (now() + '30 days'::interval),
    "trial_extended_count" integer default 0,
    "is_active" boolean default true,
    "is_paid" boolean default false,
    "account_type" text default 'trial'::text,
    "notification_sent" boolean default false,
    "last_notification_date" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "last_login" timestamp with time zone,
    "admin_notes" text,
    "disabled_reason" text,
    "role" text default 'customer'::text
      );


alter table "public"."profiles" enable row level security;


  create table "public"."purchase_items" (
    "id" uuid not null default uuid_generate_v4(),
    "purchase_id" uuid,
    "product_id" uuid,
    "product_name" text not null,
    "quantity" numeric(10,2) not null,
    "unit_price" numeric(10,2) not null,
    "total_price" numeric(10,2) not null,
    "gst_rate" numeric(5,2) default 0,
    "batch_no" text,
    "expiry_date" date,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."purchases" (
    "id" uuid not null default uuid_generate_v4(),
    "purchase_number" text not null,
    "supplier_id" uuid,
    "supplier_name" text not null,
    "subtotal" numeric(12,2) default 0,
    "discount" numeric(12,2) default 0,
    "tax_amount" numeric(12,2) default 0,
    "total_amount" numeric(12,2) default 0,
    "payment_status" payment_status default 'pending'::payment_status,
    "amount_paid" numeric(12,2) default 0,
    "invoice_number" text,
    "invoice_date" date,
    "notes" text,
    "created_by" uuid,
    "purchase_date" date default CURRENT_DATE,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."sale_items" (
    "id" uuid not null default uuid_generate_v4(),
    "sale_id" uuid,
    "product_id" uuid,
    "product_name" text not null,
    "quantity" numeric(10,2) not null,
    "unit_price" numeric(10,2) not null,
    "total_price" numeric(10,2) not null,
    "gst_rate" numeric(5,2) default 0,
    "batch_no" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."sales" (
    "id" uuid not null default uuid_generate_v4(),
    "sale_number" text not null,
    "customer_id" uuid,
    "customer_name" text not null,
    "subtotal" numeric(12,2) default 0,
    "discount" numeric(12,2) default 0,
    "tax_amount" numeric(12,2) default 0,
    "total_amount" numeric(12,2) default 0,
    "payment_method" payment_method default 'cash'::payment_method,
    "amount_paid" numeric(12,2) default 0,
    "payment_status" payment_status default 'completed'::payment_status,
    "status" transaction_status default 'completed'::transaction_status,
    "notes" text,
    "created_by" uuid,
    "sale_date" date default CURRENT_DATE,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."settings" (
    "id" uuid not null default uuid_generate_v4(),
    "key" text not null,
    "value" jsonb not null,
    "description" text,
    "category" text default 'general'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."settings" enable row level security;


  create table "public"."stock_movements" (
    "id" uuid not null default uuid_generate_v4(),
    "product_id" uuid,
    "movement_type" movement_type not null,
    "quantity" numeric(10,2) not null,
    "reference_type" text,
    "reference_id" uuid,
    "batch_no" text,
    "notes" text,
    "created_by" uuid,
    "movement_date" date default CURRENT_DATE,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."stock_movements" enable row level security;


  create table "public"."subscription_plans" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "price" numeric(10,2) not null,
    "duration_days" integer not null,
    "features" jsonb,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."subscription_plans" enable row level security;


  create table "public"."suppliers" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "contact_person" text,
    "phone" text,
    "email" text,
    "address" jsonb,
    "gst_number" text,
    "payment_terms" text default '30 days'::text,
    "credit_limit" numeric(12,2) default 0,
    "outstanding_amount" numeric(12,2) default 0,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."user_subscriptions" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "plan_id" uuid,
    "start_date" timestamp with time zone default now(),
    "end_date" timestamp with time zone,
    "is_active" boolean default true,
    "payment_method" text,
    "payment_id" text,
    "amount_paid" numeric(10,2),
    "created_at" timestamp with time zone default now()
      );


alter table "public"."user_subscriptions" enable row level security;


  create table "public"."users" (
    "id" uuid not null,
    "email" text not null,
    "name" text,
    "role" user_role default 'staff'::user_role,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX admin_actions_pkey ON public.admin_actions USING btree (id);

CREATE UNIQUE INDEX brands_name_key ON public.brands USING btree (name);

CREATE UNIQUE INDEX brands_pkey ON public.brands USING btree (id);

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions USING btree (admin_id);

CREATE INDEX idx_customers_name ON public.customers USING btree (name);

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);

CREATE INDEX idx_notification_logs_user_id ON public.notification_logs USING btree (user_id);

CREATE INDEX idx_products_active ON public.products USING btree (is_active);

CREATE INDEX idx_products_attachments ON public.products USING gin (attachments);

CREATE INDEX idx_products_brand ON public.products USING btree (brand_id);

CREATE INDEX idx_products_category ON public.products USING btree (category_id);

CREATE INDEX idx_products_code ON public.products USING btree (code);

CREATE INDEX idx_products_low_stock ON public.products USING btree (quantity, min_stock_level) WHERE (quantity <= min_stock_level);

CREATE INDEX idx_products_name ON public.products USING btree (name);

CREATE INDEX idx_products_quantity ON public.products USING btree (quantity);

CREATE INDEX idx_products_supplier ON public.products USING btree (supplier_id);

CREATE INDEX idx_profiles_account_type ON public.profiles USING btree (account_type);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_profiles_email_lookup ON public.profiles USING btree (email);

CREATE INDEX idx_profiles_is_active ON public.profiles USING btree (is_active);

CREATE INDEX idx_profiles_trial_end ON public.profiles USING btree (trial_end);

CREATE INDEX idx_profiles_trial_status ON public.profiles USING btree (is_active, trial_end, account_type);

CREATE INDEX idx_purchases_date ON public.purchases USING btree (purchase_date);

CREATE INDEX idx_purchases_number ON public.purchases USING btree (purchase_number);

CREATE INDEX idx_purchases_supplier ON public.purchases USING btree (supplier_id);

CREATE INDEX idx_sales_customer ON public.sales USING btree (customer_id);

CREATE INDEX idx_sales_date ON public.sales USING btree (sale_date);

CREATE INDEX idx_sales_number ON public.sales USING btree (sale_number);

CREATE INDEX idx_sales_status ON public.sales USING btree (status);

CREATE INDEX idx_stock_movements_date ON public.stock_movements USING btree (movement_date);

CREATE INDEX idx_stock_movements_product ON public.stock_movements USING btree (product_id);

CREATE INDEX idx_stock_movements_type ON public.stock_movements USING btree (movement_type);

CREATE INDEX idx_suppliers_name ON public.suppliers USING btree (name);

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions USING btree (user_id);

CREATE UNIQUE INDEX notification_logs_pkey ON public.notification_logs USING btree (id);

CREATE UNIQUE INDEX products_code_key ON public.products USING btree (code);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX purchase_items_pkey ON public.purchase_items USING btree (id);

CREATE UNIQUE INDEX purchases_pkey ON public.purchases USING btree (id);

CREATE UNIQUE INDEX purchases_purchase_number_key ON public.purchases USING btree (purchase_number);

CREATE UNIQUE INDEX sale_items_pkey ON public.sale_items USING btree (id);

CREATE UNIQUE INDEX sales_pkey ON public.sales USING btree (id);

CREATE UNIQUE INDEX sales_sale_number_key ON public.sales USING btree (sale_number);

CREATE UNIQUE INDEX settings_key_key ON public.settings USING btree (key);

CREATE UNIQUE INDEX settings_pkey ON public.settings USING btree (id);

CREATE UNIQUE INDEX stock_movements_pkey ON public.stock_movements USING btree (id);

CREATE UNIQUE INDEX subscription_plans_pkey ON public.subscription_plans USING btree (id);

CREATE UNIQUE INDEX suppliers_pkey ON public.suppliers USING btree (id);

CREATE UNIQUE INDEX user_subscriptions_pkey ON public.user_subscriptions USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."admin_actions" add constraint "admin_actions_pkey" PRIMARY KEY using index "admin_actions_pkey";

alter table "public"."brands" add constraint "brands_pkey" PRIMARY KEY using index "brands_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."notification_logs" add constraint "notification_logs_pkey" PRIMARY KEY using index "notification_logs_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."purchase_items" add constraint "purchase_items_pkey" PRIMARY KEY using index "purchase_items_pkey";

alter table "public"."purchases" add constraint "purchases_pkey" PRIMARY KEY using index "purchases_pkey";

alter table "public"."sale_items" add constraint "sale_items_pkey" PRIMARY KEY using index "sale_items_pkey";

alter table "public"."sales" add constraint "sales_pkey" PRIMARY KEY using index "sales_pkey";

alter table "public"."settings" add constraint "settings_pkey" PRIMARY KEY using index "settings_pkey";

alter table "public"."stock_movements" add constraint "stock_movements_pkey" PRIMARY KEY using index "stock_movements_pkey";

alter table "public"."subscription_plans" add constraint "subscription_plans_pkey" PRIMARY KEY using index "subscription_plans_pkey";

alter table "public"."suppliers" add constraint "suppliers_pkey" PRIMARY KEY using index "suppliers_pkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_pkey" PRIMARY KEY using index "user_subscriptions_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."admin_actions" add constraint "admin_actions_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES profiles(id) not valid;

alter table "public"."admin_actions" validate constraint "admin_actions_admin_id_fkey";

alter table "public"."admin_actions" add constraint "admin_actions_target_user_id_fkey" FOREIGN KEY (target_user_id) REFERENCES profiles(id) not valid;

alter table "public"."admin_actions" validate constraint "admin_actions_target_user_id_fkey";

alter table "public"."brands" add constraint "brands_name_key" UNIQUE using index "brands_name_key";

alter table "public"."categories" add constraint "categories_name_key" UNIQUE using index "categories_name_key";

alter table "public"."customers" add constraint "customers_credit_limit_check" CHECK ((credit_limit >= (0)::numeric)) not valid;

alter table "public"."customers" validate constraint "customers_credit_limit_check";

alter table "public"."customers" add constraint "customers_outstanding_amount_check" CHECK ((outstanding_amount >= (0)::numeric)) not valid;

alter table "public"."customers" validate constraint "customers_outstanding_amount_check";

alter table "public"."customers" add constraint "customers_total_purchases_check" CHECK ((total_purchases >= (0)::numeric)) not valid;

alter table "public"."customers" validate constraint "customers_total_purchases_check";

alter table "public"."notification_logs" add constraint "notification_logs_delivery_status_check" CHECK ((delivery_status = ANY (ARRAY['sent'::text, 'failed'::text, 'pending'::text]))) not valid;

alter table "public"."notification_logs" validate constraint "notification_logs_delivery_status_check";

alter table "public"."notification_logs" add constraint "notification_logs_notification_type_check" CHECK ((notification_type = ANY (ARRAY['trial_warning'::text, 'trial_expired'::text, 'account_disabled'::text, 'payment_reminder'::text]))) not valid;

alter table "public"."notification_logs" validate constraint "notification_logs_notification_type_check";

alter table "public"."notification_logs" add constraint "notification_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notification_logs" validate constraint "notification_logs_user_id_fkey";

alter table "public"."products" add constraint "products_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brands(id) not valid;

alter table "public"."products" validate constraint "products_brand_id_fkey";

alter table "public"."products" add constraint "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) not valid;

alter table "public"."products" validate constraint "products_category_id_fkey";

alter table "public"."products" add constraint "products_code_key" UNIQUE using index "products_code_key";

alter table "public"."products" add constraint "products_gst_rate_check" CHECK (((gst_rate >= (0)::numeric) AND (gst_rate <= (28)::numeric))) not valid;

alter table "public"."products" validate constraint "products_gst_rate_check";

alter table "public"."products" add constraint "products_min_stock_level_check" CHECK ((min_stock_level >= (0)::numeric)) not valid;

alter table "public"."products" validate constraint "products_min_stock_level_check";

alter table "public"."products" add constraint "products_mrp_check" CHECK ((mrp >= (0)::numeric)) not valid;

alter table "public"."products" validate constraint "products_mrp_check";

alter table "public"."products" add constraint "products_purchase_price_check" CHECK ((purchase_price >= (0)::numeric)) not valid;

alter table "public"."products" validate constraint "products_purchase_price_check";

alter table "public"."products" add constraint "products_quantity_check" CHECK ((quantity >= (0)::numeric)) not valid;

alter table "public"."products" validate constraint "products_quantity_check";

alter table "public"."products" add constraint "products_reorder_point_check" CHECK ((reorder_point >= (0)::numeric)) not valid;

alter table "public"."products" validate constraint "products_reorder_point_check";

alter table "public"."products" add constraint "products_sale_price_check" CHECK ((sale_price >= (0)::numeric)) not valid;

alter table "public"."products" validate constraint "products_sale_price_check";

alter table "public"."products" add constraint "products_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES suppliers(id) not valid;

alter table "public"."products" validate constraint "products_supplier_id_fkey";

alter table "public"."profiles" add constraint "profiles_account_type_check" CHECK ((account_type = ANY (ARRAY['trial'::text, 'paid'::text, 'admin'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_account_type_check";

alter table "public"."profiles" add constraint "profiles_email_format" CHECK ((email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)) not valid;

alter table "public"."profiles" validate constraint "profiles_email_format";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."purchase_items" add constraint "purchase_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) not valid;

alter table "public"."purchase_items" validate constraint "purchase_items_product_id_fkey";

alter table "public"."purchase_items" add constraint "purchase_items_purchase_id_fkey" FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE not valid;

alter table "public"."purchase_items" validate constraint "purchase_items_purchase_id_fkey";

alter table "public"."purchase_items" add constraint "purchase_items_quantity_check" CHECK ((quantity > (0)::numeric)) not valid;

alter table "public"."purchase_items" validate constraint "purchase_items_quantity_check";

alter table "public"."purchase_items" add constraint "purchase_items_total_price_check" CHECK ((total_price >= (0)::numeric)) not valid;

alter table "public"."purchase_items" validate constraint "purchase_items_total_price_check";

alter table "public"."purchase_items" add constraint "purchase_items_unit_price_check" CHECK ((unit_price >= (0)::numeric)) not valid;

alter table "public"."purchase_items" validate constraint "purchase_items_unit_price_check";

alter table "public"."purchases" add constraint "purchases_amount_paid_check" CHECK ((amount_paid >= (0)::numeric)) not valid;

alter table "public"."purchases" validate constraint "purchases_amount_paid_check";

alter table "public"."purchases" add constraint "purchases_discount_check" CHECK ((discount >= (0)::numeric)) not valid;

alter table "public"."purchases" validate constraint "purchases_discount_check";

alter table "public"."purchases" add constraint "purchases_purchase_number_key" UNIQUE using index "purchases_purchase_number_key";

alter table "public"."purchases" add constraint "purchases_subtotal_check" CHECK ((subtotal >= (0)::numeric)) not valid;

alter table "public"."purchases" validate constraint "purchases_subtotal_check";

alter table "public"."purchases" add constraint "purchases_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES suppliers(id) not valid;

alter table "public"."purchases" validate constraint "purchases_supplier_id_fkey";

alter table "public"."purchases" add constraint "purchases_tax_amount_check" CHECK ((tax_amount >= (0)::numeric)) not valid;

alter table "public"."purchases" validate constraint "purchases_tax_amount_check";

alter table "public"."purchases" add constraint "purchases_total_amount_check" CHECK ((total_amount >= (0)::numeric)) not valid;

alter table "public"."purchases" validate constraint "purchases_total_amount_check";

alter table "public"."sale_items" add constraint "sale_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) not valid;

alter table "public"."sale_items" validate constraint "sale_items_product_id_fkey";

alter table "public"."sale_items" add constraint "sale_items_quantity_check" CHECK ((quantity > (0)::numeric)) not valid;

alter table "public"."sale_items" validate constraint "sale_items_quantity_check";

alter table "public"."sale_items" add constraint "sale_items_sale_id_fkey" FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE not valid;

alter table "public"."sale_items" validate constraint "sale_items_sale_id_fkey";

alter table "public"."sale_items" add constraint "sale_items_total_price_check" CHECK ((total_price >= (0)::numeric)) not valid;

alter table "public"."sale_items" validate constraint "sale_items_total_price_check";

alter table "public"."sale_items" add constraint "sale_items_unit_price_check" CHECK ((unit_price >= (0)::numeric)) not valid;

alter table "public"."sale_items" validate constraint "sale_items_unit_price_check";

alter table "public"."sales" add constraint "sales_amount_paid_check" CHECK ((amount_paid >= (0)::numeric)) not valid;

alter table "public"."sales" validate constraint "sales_amount_paid_check";

alter table "public"."sales" add constraint "sales_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) not valid;

alter table "public"."sales" validate constraint "sales_customer_id_fkey";

alter table "public"."sales" add constraint "sales_discount_check" CHECK ((discount >= (0)::numeric)) not valid;

alter table "public"."sales" validate constraint "sales_discount_check";

alter table "public"."sales" add constraint "sales_sale_number_key" UNIQUE using index "sales_sale_number_key";

alter table "public"."sales" add constraint "sales_subtotal_check" CHECK ((subtotal >= (0)::numeric)) not valid;

alter table "public"."sales" validate constraint "sales_subtotal_check";

alter table "public"."sales" add constraint "sales_tax_amount_check" CHECK ((tax_amount >= (0)::numeric)) not valid;

alter table "public"."sales" validate constraint "sales_tax_amount_check";

alter table "public"."sales" add constraint "sales_total_amount_check" CHECK ((total_amount >= (0)::numeric)) not valid;

alter table "public"."sales" validate constraint "sales_total_amount_check";

alter table "public"."settings" add constraint "settings_key_key" UNIQUE using index "settings_key_key";

alter table "public"."stock_movements" add constraint "stock_movements_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) not valid;

alter table "public"."stock_movements" validate constraint "stock_movements_product_id_fkey";

alter table "public"."suppliers" add constraint "suppliers_credit_limit_check" CHECK ((credit_limit >= (0)::numeric)) not valid;

alter table "public"."suppliers" validate constraint "suppliers_credit_limit_check";

alter table "public"."suppliers" add constraint "suppliers_outstanding_amount_check" CHECK ((outstanding_amount >= (0)::numeric)) not valid;

alter table "public"."suppliers" validate constraint "suppliers_outstanding_amount_check";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_plan_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."users" validate constraint "users_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_user_properly(user_email text, user_password text, user_name text, user_role text DEFAULT 'staff'::text, user_phone text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    new_user_id UUID;
BEGIN
    -- This would typically be done through Supabase Auth API, not SQL
    -- But for reference, this is the proper flow:
    
    -- 1. Create auth.users record (done via Supabase Auth API)
    -- 2. Trigger automatically creates public.users record
    -- 3. Return the user ID
    
    -- For now, return a placeholder
    RAISE EXCEPTION 'Use Supabase Auth API to create users, not this function directly';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_product_code()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := 'PRD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('product_code_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_purchase_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.purchase_number IS NULL OR NEW.purchase_number = '' THEN
        NEW.purchase_number := 'PUR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('purchase_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_sale_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
        NEW.sale_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('sale_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Try to insert into the table that exists
    BEGIN
        -- Check which table exists and insert accordingly
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
            INSERT INTO public.users (
                id,
                email,
                name,
                role,
                account_type,
                is_active,
                is_paid,
                trial_start_date,
                trial_end_date,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
                'trial',
                'trial',
                true,
                false,
                NOW(),
                NOW() + INTERVAL '30 days',
                NOW(),
                NOW()
            );
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
            INSERT INTO public.profiles (
                id,
                email,
                name,
                account_type,
                is_active,
                trial_start,
                trial_end,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
                'trial',
                true,
                NOW(),
                NOW() + INTERVAL '30 days',
                NOW(),
                NOW()
            );
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
            INSERT INTO public.user_profiles (
                id,
                email,
                name,
                role,
                is_active,
                trial_start_date,
                trial_end_date,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
                'trial',
                true,
                NOW(),
                NOW() + INTERVAL '30 days',
                NOW(),
                NOW()
            );
        END IF;
        
        RAISE NOTICE '✅ Profile created for user: %', NEW.email;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING '⚠️ Profile creation failed for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
        -- Continue anyway - user will still be created in auth.users
    END;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN (
        SELECT role = 'admin' 
        FROM public.profiles 
        WHERE id = auth.uid()
        LIMIT 1
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If profiles table doesn't exist or any error, deny admin access
        RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN (
        SELECT role IN ('admin', 'manager') 
        FROM public.profiles 
        WHERE id = auth.uid()
        LIMIT 1
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If profiles table doesn't exist or any error, deny access
        RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_active()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Check if user exists in profiles table and is active
    RETURN (
        SELECT COALESCE(is_active, true) 
        FROM public.profiles 
        WHERE id = auth.uid()
        LIMIT 1
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If profiles table doesn't exist or any error, allow access
        RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."admin_actions" to "anon";

grant insert on table "public"."admin_actions" to "anon";

grant references on table "public"."admin_actions" to "anon";

grant select on table "public"."admin_actions" to "anon";

grant trigger on table "public"."admin_actions" to "anon";

grant truncate on table "public"."admin_actions" to "anon";

grant update on table "public"."admin_actions" to "anon";

grant delete on table "public"."admin_actions" to "authenticated";

grant insert on table "public"."admin_actions" to "authenticated";

grant references on table "public"."admin_actions" to "authenticated";

grant select on table "public"."admin_actions" to "authenticated";

grant trigger on table "public"."admin_actions" to "authenticated";

grant truncate on table "public"."admin_actions" to "authenticated";

grant update on table "public"."admin_actions" to "authenticated";

grant delete on table "public"."admin_actions" to "service_role";

grant insert on table "public"."admin_actions" to "service_role";

grant references on table "public"."admin_actions" to "service_role";

grant select on table "public"."admin_actions" to "service_role";

grant trigger on table "public"."admin_actions" to "service_role";

grant truncate on table "public"."admin_actions" to "service_role";

grant update on table "public"."admin_actions" to "service_role";

grant delete on table "public"."brands" to "anon";

grant insert on table "public"."brands" to "anon";

grant references on table "public"."brands" to "anon";

grant select on table "public"."brands" to "anon";

grant trigger on table "public"."brands" to "anon";

grant truncate on table "public"."brands" to "anon";

grant update on table "public"."brands" to "anon";

grant delete on table "public"."brands" to "authenticated";

grant insert on table "public"."brands" to "authenticated";

grant references on table "public"."brands" to "authenticated";

grant select on table "public"."brands" to "authenticated";

grant trigger on table "public"."brands" to "authenticated";

grant truncate on table "public"."brands" to "authenticated";

grant update on table "public"."brands" to "authenticated";

grant delete on table "public"."brands" to "service_role";

grant insert on table "public"."brands" to "service_role";

grant references on table "public"."brands" to "service_role";

grant select on table "public"."brands" to "service_role";

grant trigger on table "public"."brands" to "service_role";

grant truncate on table "public"."brands" to "service_role";

grant update on table "public"."brands" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."notification_logs" to "anon";

grant insert on table "public"."notification_logs" to "anon";

grant references on table "public"."notification_logs" to "anon";

grant select on table "public"."notification_logs" to "anon";

grant trigger on table "public"."notification_logs" to "anon";

grant truncate on table "public"."notification_logs" to "anon";

grant update on table "public"."notification_logs" to "anon";

grant delete on table "public"."notification_logs" to "authenticated";

grant insert on table "public"."notification_logs" to "authenticated";

grant references on table "public"."notification_logs" to "authenticated";

grant select on table "public"."notification_logs" to "authenticated";

grant trigger on table "public"."notification_logs" to "authenticated";

grant truncate on table "public"."notification_logs" to "authenticated";

grant update on table "public"."notification_logs" to "authenticated";

grant delete on table "public"."notification_logs" to "service_role";

grant insert on table "public"."notification_logs" to "service_role";

grant references on table "public"."notification_logs" to "service_role";

grant select on table "public"."notification_logs" to "service_role";

grant trigger on table "public"."notification_logs" to "service_role";

grant truncate on table "public"."notification_logs" to "service_role";

grant update on table "public"."notification_logs" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."purchase_items" to "anon";

grant insert on table "public"."purchase_items" to "anon";

grant references on table "public"."purchase_items" to "anon";

grant select on table "public"."purchase_items" to "anon";

grant trigger on table "public"."purchase_items" to "anon";

grant truncate on table "public"."purchase_items" to "anon";

grant update on table "public"."purchase_items" to "anon";

grant delete on table "public"."purchase_items" to "authenticated";

grant insert on table "public"."purchase_items" to "authenticated";

grant references on table "public"."purchase_items" to "authenticated";

grant select on table "public"."purchase_items" to "authenticated";

grant trigger on table "public"."purchase_items" to "authenticated";

grant truncate on table "public"."purchase_items" to "authenticated";

grant update on table "public"."purchase_items" to "authenticated";

grant delete on table "public"."purchase_items" to "service_role";

grant insert on table "public"."purchase_items" to "service_role";

grant references on table "public"."purchase_items" to "service_role";

grant select on table "public"."purchase_items" to "service_role";

grant trigger on table "public"."purchase_items" to "service_role";

grant truncate on table "public"."purchase_items" to "service_role";

grant update on table "public"."purchase_items" to "service_role";

grant delete on table "public"."purchases" to "anon";

grant insert on table "public"."purchases" to "anon";

grant references on table "public"."purchases" to "anon";

grant select on table "public"."purchases" to "anon";

grant trigger on table "public"."purchases" to "anon";

grant truncate on table "public"."purchases" to "anon";

grant update on table "public"."purchases" to "anon";

grant delete on table "public"."purchases" to "authenticated";

grant insert on table "public"."purchases" to "authenticated";

grant references on table "public"."purchases" to "authenticated";

grant select on table "public"."purchases" to "authenticated";

grant trigger on table "public"."purchases" to "authenticated";

grant truncate on table "public"."purchases" to "authenticated";

grant update on table "public"."purchases" to "authenticated";

grant delete on table "public"."purchases" to "service_role";

grant insert on table "public"."purchases" to "service_role";

grant references on table "public"."purchases" to "service_role";

grant select on table "public"."purchases" to "service_role";

grant trigger on table "public"."purchases" to "service_role";

grant truncate on table "public"."purchases" to "service_role";

grant update on table "public"."purchases" to "service_role";

grant delete on table "public"."sale_items" to "anon";

grant insert on table "public"."sale_items" to "anon";

grant references on table "public"."sale_items" to "anon";

grant select on table "public"."sale_items" to "anon";

grant trigger on table "public"."sale_items" to "anon";

grant truncate on table "public"."sale_items" to "anon";

grant update on table "public"."sale_items" to "anon";

grant delete on table "public"."sale_items" to "authenticated";

grant insert on table "public"."sale_items" to "authenticated";

grant references on table "public"."sale_items" to "authenticated";

grant select on table "public"."sale_items" to "authenticated";

grant trigger on table "public"."sale_items" to "authenticated";

grant truncate on table "public"."sale_items" to "authenticated";

grant update on table "public"."sale_items" to "authenticated";

grant delete on table "public"."sale_items" to "service_role";

grant insert on table "public"."sale_items" to "service_role";

grant references on table "public"."sale_items" to "service_role";

grant select on table "public"."sale_items" to "service_role";

grant trigger on table "public"."sale_items" to "service_role";

grant truncate on table "public"."sale_items" to "service_role";

grant update on table "public"."sale_items" to "service_role";

grant delete on table "public"."sales" to "anon";

grant insert on table "public"."sales" to "anon";

grant references on table "public"."sales" to "anon";

grant select on table "public"."sales" to "anon";

grant trigger on table "public"."sales" to "anon";

grant truncate on table "public"."sales" to "anon";

grant update on table "public"."sales" to "anon";

grant delete on table "public"."sales" to "authenticated";

grant insert on table "public"."sales" to "authenticated";

grant references on table "public"."sales" to "authenticated";

grant select on table "public"."sales" to "authenticated";

grant trigger on table "public"."sales" to "authenticated";

grant truncate on table "public"."sales" to "authenticated";

grant update on table "public"."sales" to "authenticated";

grant delete on table "public"."sales" to "service_role";

grant insert on table "public"."sales" to "service_role";

grant references on table "public"."sales" to "service_role";

grant select on table "public"."sales" to "service_role";

grant trigger on table "public"."sales" to "service_role";

grant truncate on table "public"."sales" to "service_role";

grant update on table "public"."sales" to "service_role";

grant delete on table "public"."settings" to "anon";

grant insert on table "public"."settings" to "anon";

grant references on table "public"."settings" to "anon";

grant select on table "public"."settings" to "anon";

grant trigger on table "public"."settings" to "anon";

grant truncate on table "public"."settings" to "anon";

grant update on table "public"."settings" to "anon";

grant delete on table "public"."settings" to "authenticated";

grant insert on table "public"."settings" to "authenticated";

grant references on table "public"."settings" to "authenticated";

grant select on table "public"."settings" to "authenticated";

grant trigger on table "public"."settings" to "authenticated";

grant truncate on table "public"."settings" to "authenticated";

grant update on table "public"."settings" to "authenticated";

grant delete on table "public"."settings" to "service_role";

grant insert on table "public"."settings" to "service_role";

grant references on table "public"."settings" to "service_role";

grant select on table "public"."settings" to "service_role";

grant trigger on table "public"."settings" to "service_role";

grant truncate on table "public"."settings" to "service_role";

grant update on table "public"."settings" to "service_role";

grant delete on table "public"."stock_movements" to "anon";

grant insert on table "public"."stock_movements" to "anon";

grant references on table "public"."stock_movements" to "anon";

grant select on table "public"."stock_movements" to "anon";

grant trigger on table "public"."stock_movements" to "anon";

grant truncate on table "public"."stock_movements" to "anon";

grant update on table "public"."stock_movements" to "anon";

grant delete on table "public"."stock_movements" to "authenticated";

grant insert on table "public"."stock_movements" to "authenticated";

grant references on table "public"."stock_movements" to "authenticated";

grant select on table "public"."stock_movements" to "authenticated";

grant trigger on table "public"."stock_movements" to "authenticated";

grant truncate on table "public"."stock_movements" to "authenticated";

grant update on table "public"."stock_movements" to "authenticated";

grant delete on table "public"."stock_movements" to "service_role";

grant insert on table "public"."stock_movements" to "service_role";

grant references on table "public"."stock_movements" to "service_role";

grant select on table "public"."stock_movements" to "service_role";

grant trigger on table "public"."stock_movements" to "service_role";

grant truncate on table "public"."stock_movements" to "service_role";

grant update on table "public"."stock_movements" to "service_role";

grant delete on table "public"."subscription_plans" to "anon";

grant insert on table "public"."subscription_plans" to "anon";

grant references on table "public"."subscription_plans" to "anon";

grant select on table "public"."subscription_plans" to "anon";

grant trigger on table "public"."subscription_plans" to "anon";

grant truncate on table "public"."subscription_plans" to "anon";

grant update on table "public"."subscription_plans" to "anon";

grant delete on table "public"."subscription_plans" to "authenticated";

grant insert on table "public"."subscription_plans" to "authenticated";

grant references on table "public"."subscription_plans" to "authenticated";

grant select on table "public"."subscription_plans" to "authenticated";

grant trigger on table "public"."subscription_plans" to "authenticated";

grant truncate on table "public"."subscription_plans" to "authenticated";

grant update on table "public"."subscription_plans" to "authenticated";

grant delete on table "public"."subscription_plans" to "service_role";

grant insert on table "public"."subscription_plans" to "service_role";

grant references on table "public"."subscription_plans" to "service_role";

grant select on table "public"."subscription_plans" to "service_role";

grant trigger on table "public"."subscription_plans" to "service_role";

grant truncate on table "public"."subscription_plans" to "service_role";

grant update on table "public"."subscription_plans" to "service_role";

grant delete on table "public"."suppliers" to "anon";

grant insert on table "public"."suppliers" to "anon";

grant references on table "public"."suppliers" to "anon";

grant select on table "public"."suppliers" to "anon";

grant trigger on table "public"."suppliers" to "anon";

grant truncate on table "public"."suppliers" to "anon";

grant update on table "public"."suppliers" to "anon";

grant delete on table "public"."suppliers" to "authenticated";

grant insert on table "public"."suppliers" to "authenticated";

grant references on table "public"."suppliers" to "authenticated";

grant select on table "public"."suppliers" to "authenticated";

grant trigger on table "public"."suppliers" to "authenticated";

grant truncate on table "public"."suppliers" to "authenticated";

grant update on table "public"."suppliers" to "authenticated";

grant delete on table "public"."suppliers" to "service_role";

grant insert on table "public"."suppliers" to "service_role";

grant references on table "public"."suppliers" to "service_role";

grant select on table "public"."suppliers" to "service_role";

grant trigger on table "public"."suppliers" to "service_role";

grant truncate on table "public"."suppliers" to "service_role";

grant update on table "public"."suppliers" to "service_role";

grant delete on table "public"."user_subscriptions" to "anon";

grant insert on table "public"."user_subscriptions" to "anon";

grant references on table "public"."user_subscriptions" to "anon";

grant select on table "public"."user_subscriptions" to "anon";

grant trigger on table "public"."user_subscriptions" to "anon";

grant truncate on table "public"."user_subscriptions" to "anon";

grant update on table "public"."user_subscriptions" to "anon";

grant delete on table "public"."user_subscriptions" to "authenticated";

grant insert on table "public"."user_subscriptions" to "authenticated";

grant references on table "public"."user_subscriptions" to "authenticated";

grant select on table "public"."user_subscriptions" to "authenticated";

grant trigger on table "public"."user_subscriptions" to "authenticated";

grant truncate on table "public"."user_subscriptions" to "authenticated";

grant update on table "public"."user_subscriptions" to "authenticated";

grant delete on table "public"."user_subscriptions" to "service_role";

grant insert on table "public"."user_subscriptions" to "service_role";

grant references on table "public"."user_subscriptions" to "service_role";

grant select on table "public"."user_subscriptions" to "service_role";

grant trigger on table "public"."user_subscriptions" to "service_role";

grant truncate on table "public"."user_subscriptions" to "service_role";

grant update on table "public"."user_subscriptions" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "Admin full access"
  on "public"."admin_actions"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Admins can manage admin actions"
  on "public"."admin_actions"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_type = 'admin'::text)))));



  create policy "Enable read for authenticated"
  on "public"."admin_actions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for authenticated"
  on "public"."admin_actions"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Enable write for authenticated"
  on "public"."admin_actions"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "brands_delete_authenticated"
  on "public"."brands"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "brands_insert_authenticated"
  on "public"."brands"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "brands_select_all"
  on "public"."brands"
  as permissive
  for select
  to public
using (true);



  create policy "brands_update_authenticated"
  on "public"."brands"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "categories_delete_authenticated"
  on "public"."categories"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "categories_insert_authenticated"
  on "public"."categories"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "categories_select_all"
  on "public"."categories"
  as permissive
  for select
  to public
using (true);



  create policy "categories_update_authenticated"
  on "public"."categories"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "Admin full access"
  on "public"."customers"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Authenticated users can view customers"
  on "public"."customers"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Enable read for authenticated"
  on "public"."customers"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for authenticated"
  on "public"."customers"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Enable write for authenticated"
  on "public"."customers"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Service role full access"
  on "public"."customers"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Admin full access"
  on "public"."notification_logs"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Admins can view all notifications"
  on "public"."notification_logs"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_type = 'admin'::text)))));



  create policy "Enable read for authenticated"
  on "public"."notification_logs"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for authenticated"
  on "public"."notification_logs"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Enable write for authenticated"
  on "public"."notification_logs"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Users can view own notifications"
  on "public"."notification_logs"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "products_delete_authenticated"
  on "public"."products"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "products_insert_authenticated"
  on "public"."products"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "products_select_authenticated"
  on "public"."products"
  as permissive
  for select
  to authenticated
using (true);



  create policy "products_select_public"
  on "public"."products"
  as permissive
  for select
  to public
using (true);



  create policy "products_update_authenticated"
  on "public"."products"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "profiles_admin_access"
  on "public"."profiles"
  as permissive
  for all
  to public
using ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE (((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text) OR ((users.email)::text = ANY ((ARRAY['admin@krishisethu.com'::character varying, 'admin@example.com'::character varying])::text[]))))));



  create policy "profiles_insert_own"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "profiles_select_own"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "profiles_update_own"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Admin full access"
  on "public"."purchase_items"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Authenticated users can view purchase_items"
  on "public"."purchase_items"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Enable read for authenticated"
  on "public"."purchase_items"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for authenticated"
  on "public"."purchase_items"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Enable write for authenticated"
  on "public"."purchase_items"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Service role full access"
  on "public"."purchase_items"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Admin full access"
  on "public"."purchases"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Authenticated users can view purchases"
  on "public"."purchases"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Enable read for authenticated"
  on "public"."purchases"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for authenticated"
  on "public"."purchases"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Enable write for authenticated"
  on "public"."purchases"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Service role full access"
  on "public"."purchases"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Admin full access"
  on "public"."sale_items"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Authenticated users can view sale_items"
  on "public"."sale_items"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Enable read for authenticated"
  on "public"."sale_items"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for authenticated"
  on "public"."sale_items"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Enable write for authenticated"
  on "public"."sale_items"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Service role full access"
  on "public"."sale_items"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Admin full access"
  on "public"."sales"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Authenticated users can view sales"
  on "public"."sales"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Enable read for authenticated"
  on "public"."sales"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for authenticated"
  on "public"."sales"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Enable write for authenticated"
  on "public"."sales"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Service role full access"
  on "public"."sales"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Admin full access"
  on "public"."settings"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Enable read for authenticated"
  on "public"."settings"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for authenticated"
  on "public"."settings"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Enable write for authenticated"
  on "public"."settings"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Service role full access"
  on "public"."settings"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Settings are viewable by authenticated users"
  on "public"."settings"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Admin full access"
  on "public"."stock_movements"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Authenticated users can view stock_movements"
  on "public"."stock_movements"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Enable read for authenticated"
  on "public"."stock_movements"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for authenticated"
  on "public"."stock_movements"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Enable write for authenticated"
  on "public"."stock_movements"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Service role full access"
  on "public"."stock_movements"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text));



  create policy "Admin full access"
  on "public"."subscription_plans"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Anyone can view subscription plans"
  on "public"."subscription_plans"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Enable read for authenticated"
  on "public"."subscription_plans"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for authenticated"
  on "public"."subscription_plans"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Enable write for authenticated"
  on "public"."subscription_plans"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "suppliers_delete_authenticated"
  on "public"."suppliers"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "suppliers_insert_authenticated"
  on "public"."suppliers"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "suppliers_select_all"
  on "public"."suppliers"
  as permissive
  for select
  to public
using (true);



  create policy "suppliers_update_authenticated"
  on "public"."suppliers"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "Admin full access"
  on "public"."user_subscriptions"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Admins can view all subscriptions"
  on "public"."user_subscriptions"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.account_type = 'admin'::text)))));



  create policy "Enable read for authenticated"
  on "public"."user_subscriptions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for authenticated"
  on "public"."user_subscriptions"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Enable write for authenticated"
  on "public"."user_subscriptions"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Users can view own subscriptions"
  on "public"."user_subscriptions"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "users_admin_access"
  on "public"."users"
  as permissive
  for all
  to public
using ((auth.uid() IN ( SELECT users_1.id
   FROM auth.users users_1
  WHERE (((users_1.raw_user_meta_data ->> 'role'::text) = 'admin'::text) OR ((users_1.email)::text = ANY ((ARRAY['admin@krishisethu.com'::character varying, 'admin@example.com'::character varying])::text[]))))));



  create policy "users_insert_own"
  on "public"."users"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "users_select_own"
  on "public"."users"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "users_update_own"
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = id));


CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_product_code_trigger BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION generate_product_code();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_purchase_number_trigger BEFORE INSERT ON public.purchases FOR EACH ROW EXECUTE FUNCTION generate_purchase_number();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_sale_number_trigger BEFORE INSERT ON public.sales FOR EACH ROW EXECUTE FUNCTION generate_sale_number();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


