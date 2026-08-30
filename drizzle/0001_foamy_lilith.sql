CREATE TABLE `schedule_slots` (
	`weekday` integer NOT NULL,
	`start_time` text NOT NULL,
	`occupied` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`weekday`, `start_time`)
);
