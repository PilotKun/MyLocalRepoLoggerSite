CREATE TABLE "favorite_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"media_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "list_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"list_id" integer NOT NULL,
	"media_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"tmdb_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"poster_path" text,
	"backdrop_path" text,
	"overview" text,
	"release_date" text,
	"vote_average" integer,
	"episode_count" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "watched_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"media_id" integer NOT NULL,
	"rating" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"media_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
