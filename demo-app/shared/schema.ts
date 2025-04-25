import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Test Runs table
export const testRuns = pgTable("test_runs", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  protectedUrl: text("protected_url").notNull(),
  unprotectedUrl: text("unprotected_url").notNull(),
  numRequests: integer("num_requests").notNull(),
  result: jsonb("result").notNull(),
});

// Request Logs table
export const requestLogs = pgTable("request_logs", {
  id: serial("id").primaryKey(),
  testRunId: integer("test_run_id").references(() => testRuns.id).notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  status: integer("status").notNull(),
  timeInSeconds: text("time_in_seconds").notNull(),
  requestId: integer("request_id").notNull(),
  success: boolean("success").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create schemas for validation
export const testRunInsertSchema = createInsertSchema(testRuns);
// Add custom validation on top of the generated schema
export const testRunValidationSchema = testRunInsertSchema
  .extend({
    protectedUrl: z.string().url("Protected URL must be a valid URL"),
    unprotectedUrl: z.string().url("Unprotected URL must be a valid URL"),
    numRequests: z.number().int().min(1, "Must run at least 1 request").max(1000, "Cannot exceed 1000 requests"),
  });

export const requestLogInsertSchema = createInsertSchema(requestLogs);
// Add custom validation on top of the generated schema
export const requestLogValidationSchema = requestLogInsertSchema
  .extend({
    type: z.enum(["PROTECTED", "UNPROTECTED"], { description: "Type must be either PROTECTED or UNPROTECTED" }),
    status: z.number().int().min(100, "Invalid status code").max(599, "Invalid status code"),
    success: z.boolean(),
  });

// Define relationship between testRuns and requestLogs
export const testRunsRelations = {
  requestLogs: () => requestLogs,
};

export const requestLogsRelations = {
  testRun: () => testRuns,
};

// Export types
export type TestRun = typeof testRuns.$inferSelect;
export type TestRunInsert = z.infer<typeof testRunInsertSchema>;
export type RequestLog = typeof requestLogs.$inferSelect;
export type RequestLogInsert = z.infer<typeof requestLogInsertSchema>;
