import { pgTable, text, integer, bigint, boolean, timestamp, jsonb, primaryKey, uuid, index } from 'drizzle-orm/pg-core';

/**
 * FILES TABLE
 * Physical storage layer. Tracks actual files in R2.
 */
export const files = pgTable('files', {
    id: uuid('id').primaryKey().defaultRandom(),
    objectKey: text('object_key').notNull().unique(),
    mimeType: text('mime_type'),
    sizeBytes: bigint('size_bytes', { mode: 'number' }),
    originalName: text('original_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * VIDEO THUMBNAILS
 * Metadata linking videos to their generated thumbnails.
 */
export const videoThumbnails = pgTable('video_thumbnails', {
    id: uuid('id').primaryKey().defaultRandom(),
    fileId: uuid('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
    thumbnailFileId: uuid('thumbnail_file_id').notNull().references(() => files.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * USERS TABLE
 * Core application users. Linked to Neon Auth but handles app-specific roles and avatars.
 */
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash'), // Make optional for social sync
    avatarFileId: uuid('avatar_file_id').references(() => files.id),
    avatarUrl: text('avatar_url'), // Add URL field for social sync
    role: text('role').notNull().default('user'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * ARTISTS TABLE
 * Information about creators. Independent from users.
 */
export const artists = pgTable('artists', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    bio: text('bio'),
    avatarFileId: uuid('avatar_file_id').references(() => files.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * CONTENT TABLE
 * The primary metadata layer for all media.
 */
export const content = pgTable('content', {
    id: uuid('id').primaryKey().defaultRandom(),
    uploaderId: uuid('uploader_id').notNull().references(() => users.id),
    fileId: uuid('file_id').references(() => files.id),
    name: text('name').notNull(),
    description: text('description'),

    category: text('category'),
    visibility: text('visibility').notNull().default('public'),
    status: text('status').notNull().default('active'),
    processedMetadata: jsonb('processed_metadata').$type<{
        duration?: number;
        hasPreview?: boolean;
        hasPoster?: boolean;
        hasSprites?: boolean;
    }>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    index('idx_content_uploader').on(table.uploaderId),
    index('idx_content_category').on(table.category),
    index('idx_content_visibility').on(table.visibility, table.status),
]);

/**
 * CONTENT ARTISTS
 * Many-to-Many relationship for credits.
 */
export const contentArtists = pgTable('content_artists', {
    contentId: uuid('content_id').references(() => content.id, { onDelete: 'cascade' }),
    artistId: uuid('artist_id').references(() => artists.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('author'),
}, (table) => [
    primaryKey({ columns: [table.contentId, table.artistId, table.role] }),
    index('idx_content_artists').on(table.artistId),
]);

/**
 * SERIES
 * Collections of files (e.g., chapters or pages).
 */
export const series = pgTable('series', {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id').notNull().unique().references(() => content.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * SERIES ITEMS
 * Linking series to specific files with an ordering index.
 */
export const seriesItems = pgTable('series_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    seriesId: uuid('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
    fileId: uuid('file_id').notNull().references(() => files.id),
    orderIndex: integer('order_index').notNull(),
    title: text('title'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    index('idx_series_items_order').on(table.seriesId, table.orderIndex),
]);

/**
 * TAGS TABLE
 * Normalized taxonomy for content.
 */
export const tags = pgTable('tags', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * CONTENT TAGS
 * Junction table for tagging content.
 */
export const contentTags = pgTable('content_tags', {
    contentId: uuid('content_id').references(() => content.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
    primaryKey({ columns: [table.contentId, table.tagId] }),
    index('idx_content_tags_tag').on(table.tagId),
]);

/**
 * BOOKMARKS
 * User preferences for content.
 */
export const bookmarks = pgTable('bookmarks', {
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    contentId: uuid('content_id').references(() => content.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    primaryKey({ columns: [table.userId, table.contentId] }),
    index('idx_bookmarks_user').on(table.userId),
]);

/**
 * CONTENT STATS
 * Isolates high-write traffic from core content updates.
 */
export const contentStats = pgTable('content_stats', {
    contentId: uuid('content_id').primaryKey().references(() => content.id, { onDelete: 'cascade' }),
    viewCount: bigint('view_count', { mode: 'number' }).notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});



