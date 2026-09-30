// Aşkım — interactive dining platform · database schema
// Built by Solunera
import { relations, sql } from "drizzle-orm";
import {
  boolean, doublePrecision, index, integer, pgTable, serial, text, timestamp,
} from "drizzle-orm/pg-core";

const id = () => text("id").primaryKey().default(sql`gen_random_uuid()::text`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/** Single-row settings (id = 1) */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  nameAr: text("name_ar").notNull().default("أشكم"),
  nameEn: text("name_en").notNull().default("Aşkım"),
  taglineAr: text("tagline_ar").notNull().default("مطبخ شامي بروح تركية"),
  taglineEn: text("tagline_en").notNull().default("Levantine kitchen, Turkish soul"),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  instagram: text("instagram"),
  facebook: text("facebook"),
  googleReviews: text("google_reviews"),
  address: text("address"),
  /** How many NEW Syrian pounds equal 1 unit of each currency */
  rateUSD: doublePrecision("rate_usd").notNull().default(110),
  rateEUR: doublePrecision("rate_eur").notNull().default(128),
  rateTRY: doublePrecision("rate_try").notNull().default(2.7),
  rateAED: doublePrecision("rate_aed").notNull().default(30),
  showOldSYP: boolean("show_old_syp").notNull().default(true),
  serviceFeePct: doublePrecision("service_fee_pct").notNull().default(0),
  giftsEnabled: boolean("gifts_enabled").notNull().default(true),
  ordersEnabled: boolean("orders_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id"),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descAr: text("desc_ar"),
  descEn: text("desc_en"),
  image: text("image"),
  sort: integer("sort").notNull().default(0),
  active: boolean("active").notNull().default(true),
  /** Dayparts when promoted: morning | afternoon | evening | night */
  dayparts: text("dayparts").array().notNull().default(sql`'{}'::text[]`),
}, (t) => [index("categories_parent_idx").on(t.parentId)]);

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descAr: text("desc_ar"),
  descEn: text("desc_en"),
  /** Price in NEW Syrian pounds (1 new = 100 old) */
  price: integer("price").notNull(),
  image: text("image"),
  sort: integer("sort").notNull().default(0),
  available: boolean("available").notNull().default(true),
  signature: boolean("signature").notNull().default(false),
  /** spicy | vegetarian | sharing | cold | hot | kids | turkish | new */
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  /** Oracle role: breakfast | mezza | salad | soup | bread | main | side | drink | dessert | shisha */
  role: text("role").notNull().default("main"),
  serves: integer("serves").notNull().default(1),
  prepMinutes: integer("prep_minutes").notNull().default(15),
  pairings: integer("pairings").array().notNull().default(sql`'{}'::int[]`),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("items_category_idx").on(t.categoryId)]);

export const itemOptions = pgTable("item_options", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  priceDelta: integer("price_delta").notNull().default(0),
  sort: integer("sort").notNull().default(0),
});

export const tables = pgTable("dining_tables", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  zone: text("zone").notNull().default("Main hall"),
  seats: integer("seats").notNull().default(4),
  token: text("token").notNull().unique(),
  active: boolean("active").notNull().default(true),
});

export const sessions = pgTable("table_sessions", {
  id: id(),
  tableId: integer("table_id").notNull().references(() => tables.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("open"), // open | closed
  createdAt: createdAt(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
}, (t) => [index("sessions_table_idx").on(t.tableId, t.status)]);

export const guests = pgTable("guests", {
  id: id(),
  sessionId: text("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: createdAt(),
});

export const cartLines = pgTable("cart_lines", {
  id: id(),
  sessionId: text("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  guestId: text("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
  itemId: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  optionId: integer("option_id"),
  qty: integer("qty").notNull().default(1),
  note: text("note"),
  createdAt: createdAt(),
}, (t) => [index("cart_session_idx").on(t.sessionId)]);

export const orders = pgTable("orders", {
  id: id(),
  number: serial("number"),
  sessionId: text("session_id").references(() => sessions.id, { onDelete: "set null" }),
  tableId: integer("table_id").notNull().references(() => tables.id, { onDelete: "cascade" }),
  /** new | preparing | ready | served | cancelled */
  status: text("status").notNull().default("new"),
  isGift: boolean("is_gift").notNull().default(false),
  total: integer("total").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("orders_status_idx").on(t.status), index("orders_created_idx").on(t.createdAt)]);

export const orderLines = pgTable("order_lines", {
  id: id(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  itemId: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  guestId: text("guest_id").references(() => guests.id, { onDelete: "set null" }),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  optionName: text("option_name"),
  unitPrice: integer("unit_price").notNull(),
  qty: integer("qty").notNull(),
  note: text("note"),
}, (t) => [index("order_lines_order_idx").on(t.orderId)]);

export const serviceRequests = pgTable("service_requests", {
  id: id(),
  tableId: integer("table_id").notNull().references(() => tables.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  /** waiter | bill | coal | water | napkins | clean */
  type: text("type").notNull(),
  status: text("status").notNull().default("open"), // open | ack | done
  createdAt: createdAt(),
  handledAt: timestamp("handled_at", { withTimezone: true }),
}, (t) => [index("requests_status_idx").on(t.status)]);

export const gifts = pgTable("gifts", {
  id: id(),
  fromTableId: integer("from_table_id").notNull().references(() => tables.id, { onDelete: "cascade" }),
  toTableId: integer("to_table_id").notNull().references(() => tables.id, { onDelete: "cascade" }),
  itemId: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  guestId: text("guest_id"),
  message: text("message"),
  senderName: text("sender_name"),
  anonymous: boolean("anonymous").notNull().default(true),
  /** pending (staff review) | approved (on its way) | delivered | declined */
  status: text("status").notNull().default("pending"),
  seenAt: timestamp("seen_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("gifts_status_idx").on(t.status), index("gifts_to_idx").on(t.toTableId)]);

export const itemViews = pgTable("item_views", {
  id: id(),
  itemId: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => [index("views_item_idx").on(t.itemId, t.createdAt)]);

export const feedback = pgTable("feedback", {
  id: id(),
  tableId: integer("table_id").references(() => tables.id, { onDelete: "set null" }),
  stars: integer("stars").notNull(),
  comment: text("comment"),
  createdAt: createdAt(),
});

// ───────── relations ─────────
export const categoriesRelations = relations(categories, ({ many, one }) => ({
  items: many(items),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: "tree" }),
  children: many(categories, { relationName: "tree" }),
}));
export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, { fields: [items.categoryId], references: [categories.id] }),
  options: many(itemOptions),
}));
export const itemOptionsRelations = relations(itemOptions, ({ one }) => ({
  item: one(items, { fields: [itemOptions.itemId], references: [items.id] }),
}));
export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  table: one(tables, { fields: [sessions.tableId], references: [tables.id] }),
  guests: many(guests),
  cart: many(cartLines),
  orders: many(orders),
}));
export const guestsRelations = relations(guests, ({ one }) => ({
  session: one(sessions, { fields: [guests.sessionId], references: [sessions.id] }),
}));
export const cartLinesRelations = relations(cartLines, ({ one }) => ({
  session: one(sessions, { fields: [cartLines.sessionId], references: [sessions.id] }),
  guest: one(guests, { fields: [cartLines.guestId], references: [guests.id] }),
  item: one(items, { fields: [cartLines.itemId], references: [items.id] }),
}));
export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(tables, { fields: [orders.tableId], references: [tables.id] }),
  session: one(sessions, { fields: [orders.sessionId], references: [sessions.id] }),
  lines: many(orderLines),
}));
export const orderLinesRelations = relations(orderLines, ({ one }) => ({
  order: one(orders, { fields: [orderLines.orderId], references: [orders.id] }),
  guest: one(guests, { fields: [orderLines.guestId], references: [guests.id] }),
}));
export const giftsRelations = relations(gifts, ({ one }) => ({
  item: one(items, { fields: [gifts.itemId], references: [items.id] }),
  fromTable: one(tables, { fields: [gifts.fromTableId], references: [tables.id], relationName: "from" }),
  toTable: one(tables, { fields: [gifts.toTableId], references: [tables.id], relationName: "to" }),
}));
export const tablesRelations = relations(tables, ({ many }) => ({
  sessions: many(sessions),
}));

export type Item = typeof items.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type ItemOption = typeof itemOptions.$inferSelect;
export type Settings = typeof settings.$inferSelect;
