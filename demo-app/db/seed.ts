import { db } from "./index";
import * as schema from "@shared/schema";

async function seed() {
  try {
    // Seed code for test runs and request logs if needed
    console.log("Database seed successful");
  } catch (error) {
    console.error(error);
  }
}

seed();
