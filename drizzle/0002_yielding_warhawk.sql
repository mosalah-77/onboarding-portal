CREATE TABLE `objects` (
	`key` text PRIMARY KEY NOT NULL,
	`sha256` text NOT NULL,
	`body` blob NOT NULL
);
