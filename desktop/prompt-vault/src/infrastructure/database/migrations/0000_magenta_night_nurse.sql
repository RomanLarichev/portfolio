CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prompt_tags` (
	`prompt_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prompt_tags_pk` ON `prompt_tags` (`prompt_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `prompt_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`content` text NOT NULL,
	`change_note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prompt_versions_prompt_num_idx` ON `prompt_versions` (`prompt_id`,`version_number`);--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`category_id` text,
	`project_id` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`last_used_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `prompts_title_idx` ON `prompts` (`title`);--> statement-breakpoint
CREATE INDEX `prompts_project_idx` ON `prompts` (`project_id`);--> statement-breakpoint
CREATE INDEX `prompts_category_idx` ON `prompts` (`category_id`);--> statement-breakpoint
CREATE INDEX `prompts_status_idx` ON `prompts` (`status`);--> statement-breakpoint
CREATE INDEX `prompts_updated_idx` ON `prompts` (`updated_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);