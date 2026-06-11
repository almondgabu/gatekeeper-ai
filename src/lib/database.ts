import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function getDatabase() {
  return open({
    filename: "./gatekeeper.db",
    driver: sqlite3.Database,
  });
}