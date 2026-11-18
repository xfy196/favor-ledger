-- Better Auth tables
CREATE TABLE `user` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL UNIQUE,
  `email_verified` integer NOT NULL DEFAULT 0,
  `image` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE `session` (
  `id` text PRIMARY KEY NOT NULL,
  `expires_at` integer NOT NULL,
  `token` text NOT NULL UNIQUE,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `ip_address` text,
  `user_agent` text,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE
);

CREATE TABLE `account` (
  `id` text PRIMARY KEY NOT NULL,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `access_token` text,
  `refresh_token` text,
  `id_token` text,
  `access_token_expires_at` integer,
  `refresh_token_expires_at` integer,
  `scope` text,
  `password` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE TABLE `verification` (
  `id` text PRIMARY KEY NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` integer NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);

-- Business tables
CREATE TABLE `families` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_user_id` text NOT NULL UNIQUE REFERENCES `user`(`id`) ON DELETE CASCADE,
  `family_name` text NOT NULL DEFAULT '',
  `created_at` integer NOT NULL
);

CREATE TABLE `members` (
  `id` text PRIMARY KEY NOT NULL,
  `family_id` text NOT NULL REFERENCES `families`(`id`) ON DELETE CASCADE,
  `name` text NOT NULL,
  `created_at` integer NOT NULL,
  UNIQUE (`family_id`, `name`)
);

CREATE TABLE `records` (
  `id` text PRIMARY KEY NOT NULL,
  `family_id` text NOT NULL REFERENCES `families`(`id`) ON DELETE CASCADE,
  `person` text NOT NULL,
  `direction` text NOT NULL CHECK (`direction` IN ('in', 'out')),
  `amount_cents` integer NOT NULL CHECK (`amount_cents` > 0),
  `occasion` text,
  `date` text NOT NULL,
  `member` text NOT NULL,
  `note` text,
  `target_id` text,
  `created_at` integer NOT NULL
);

CREATE INDEX `idx_records_family_date` ON `records` (`family_id`, `date` DESC, `created_at` DESC);
CREATE INDEX `idx_records_family_person` ON `records` (`family_id`, `person`);
CREATE INDEX `idx_records_target` ON `records` (`family_id`, `target_id`);
CREATE INDEX `idx_members_family` ON `members` (`family_id`);
