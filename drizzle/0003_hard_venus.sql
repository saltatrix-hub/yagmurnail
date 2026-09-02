CREATE TABLE `hairdressers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `hairdressers` (`id`, `name`, `category`, `active`, `created_at`) VALUES ('legacy-yagmur', 'Yağmur', 'female', 1, CURRENT_TIMESTAMP);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_schedule_slots` (
	`hairdresser_id` text NOT NULL,
	`weekday` integer NOT NULL,
	`start_time` text NOT NULL,
	`occupied` integer DEFAULT false NOT NULL,
	`admin_note` text,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`hairdresser_id`, `weekday`, `start_time`)
);
--> statement-breakpoint
INSERT INTO `__new_schedule_slots`("hairdresser_id", "weekday", "start_time", "occupied", "admin_note", "updated_at") SELECT 'legacy-yagmur', "weekday", "start_time", "occupied", "admin_note", "updated_at" FROM `schedule_slots`;--> statement-breakpoint
DROP TABLE `schedule_slots`;--> statement-breakpoint
ALTER TABLE `__new_schedule_slots` RENAME TO `schedule_slots`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `bookings` ADD `hairdresser_id` text DEFAULT 'legacy-yagmur' NOT NULL;
