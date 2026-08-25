CREATE TABLE `booking_slots` (
	`appointment_date` text NOT NULL,
	`slot_time` text NOT NULL,
	`booking_id` text NOT NULL,
	PRIMARY KEY(`appointment_date`, `slot_time`),
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_code` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`note` text,
	`appointment_date` text NOT NULL,
	`start_time` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`service_ids` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_booking_code_unique` ON `bookings` (`booking_code`);