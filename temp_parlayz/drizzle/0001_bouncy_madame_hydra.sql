CREATE TABLE `bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`marketId` int NOT NULL,
	`betType` enum('moneyline','spread','over','under') NOT NULL,
	`selection` varchar(128) NOT NULL,
	`odds` int NOT NULL,
	`stake` decimal(10,2) NOT NULL,
	`potentialPayout` decimal(10,2) NOT NULL,
	`status` enum('Pending','Won','Lost') NOT NULL DEFAULT 'Pending',
	`isParlay` int DEFAULT 0,
	`parlayId` varchar(64),
	`txHash` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sport` varchar(32) NOT NULL,
	`homeTeam` varchar(128) NOT NULL,
	`awayTeam` varchar(128) NOT NULL,
	`commenceTime` timestamp NOT NULL,
	`homeOddsML` int,
	`awayOddsML` int,
	`homeOddsSpread` int,
	`awayOddsSpread` int,
	`spreadLine` decimal(4,1),
	`overOdds` int,
	`underOdds` int,
	`totalLine` decimal(5,1),
	`homePublicPct` int DEFAULT 50,
	`status` enum('open','live','closed','resolved') NOT NULL DEFAULT 'open',
	`externalId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `markets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`address` varchar(64) NOT NULL,
	`walletType` varchar(32) NOT NULL,
	`balance` decimal(18,6),
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_connections_id` PRIMARY KEY(`id`)
);
