import { Database, open } from "sqlite";
import { GuildState } from "../guildState";
import { StateAdapter } from "./StateAdapter";
import sqlite3 from "sqlite3";
import GuildTable from "../../types/SQLite";

// GuildList Table includes the following columns:
// guildId: string;

// Guild Table includes the following columns:
// id: number;
// guildId: string;
// queue: string; // comma-separated string of member IDs\
// queueIndex: number; // index of the current member in the queue
// announceChannel: string; // channel ID
// reminderTime: string; // time in HH:mm format
// weeklyDays: string; // comma-separated string of days
// shouldReAnnounce: boolean;

export class SQLiteAdapter implements StateAdapter<string> {
  public async saveGuild(guildId: string): Promise<void> {
    this.checkAndCreateGuild(guildId);
  }
  private static db: Database<sqlite3.Database, sqlite3.Statement> | null =
    null;

  async init(): Promise<void> {
    try {
      console.log("initializing SQLite database...");
      const db = await open({
        filename: "./db.sqlite",
        driver: sqlite3.Database,
      });

      await db.exec(
        `CREATE TABLE IF NOT EXISTS GuildList (
          id INTEGER PRIMARY KEY,
          guildId TEXT UNIQUE
      )`
      );

      await db.exec(
        `CREATE TABLE IF NOT EXISTS Guild (
          id INTEGER PRIMARY KEY,
          guildId TEXT,
          queue TEXT,
          queueIndex INTEGER,
          announceChannel TEXT,
          reminderTime TEXT,
          weeklyDays TEXT,
          shouldReAnnounce BOOLEAN
        )`
      );

      SQLiteAdapter.db = db;
    } catch (error) {
      console.error("Failed to initialize the database:", error);
    }
  }

  private async checkAndCreateGuild(guildId: string) {
    const guildList = await SQLiteAdapter.db?.get(
      "SELECT * FROM GuildList WHERE guildId = ?",
      [guildId]
    );

    if (!guildList) {
      await SQLiteAdapter.db
        ?.run("INSERT INTO GuildList (guildId) VALUES (?)", [guildId])
        .catch((error) => {
          console.error("Failed to insert into GuildList:", error);
        });
      await SQLiteAdapter.db?.run("INSERT INTO Guild (guildId) VALUES (?)", [
        guildId,
      ]);
    }
  }

  public close(): void {
    if (SQLiteAdapter.db) {
      SQLiteAdapter.db.close().catch((error) => {
        console.error("Failed to close the database:", error);
      });
    }
  }

  public async getAllGuildIds(): Promise<string[]> {
    const guildList = await SQLiteAdapter.db?.all<
      {
        id: number;
        guildId: string;
      }[]
    >("SELECT * FROM GuildList");

    if (!guildList) {
      return [];
    }

    return guildList.map((guild) => guild.guildId);
  }

  public async getGuildState(
    guildId: string
  ): Promise<GuildState<string> | null> {
    const guildState = (await SQLiteAdapter.db?.get(
      "SELECT * FROM Guild WHERE guildId = ?",
      [guildId]
    )) as GuildTable | null;

    if (!guildState) {
      return null;
    }

    return new GuildState<string>(
      {
        queue: GuildTable.stringToArray(guildState.queue ?? ""),
        guildId,
        announceChannel: guildState.announceChannel,
        reminderTime: guildState.reminderTime,
        shouldReAnnounce: guildState.shouldReAnnounce,
        weeklyDays: GuildTable.stringToArray(guildState.weeklyDays),
      },
      this
    );
  }

  public saveAnnounceChannel(guildId: string, channelId: string): void {
    this.checkAndCreateGuild(guildId);

    SQLiteAdapter.db?.run(
      "UPDATE Guild SET announceChannel = ? WHERE guildId = ?",
      [channelId, guildId]
    );
  }

  public saveReminderTime(guildId: string, time: string): void {
    this.checkAndCreateGuild(guildId);

    SQLiteAdapter.db?.run(
      "UPDATE Guild SET reminderTime = ? WHERE guildId = ?",
      [time, guildId]
    );
  }

  public saveWeeklyDays(guildId: string, days: string[]): void {
    this.checkAndCreateGuild(guildId);

    const daysString = GuildTable.arrayToString(days);
    SQLiteAdapter.db?.run("UPDATE Guild SET weeklyDays = ? WHERE guildId = ?", [
      daysString,
      guildId,
    ]);
  }

  public saveShouldReAnnounce(
    guildId: string,
    shouldReAnnounce: boolean
  ): void {
    this.checkAndCreateGuild(guildId);

    SQLiteAdapter.db?.run(
      "UPDATE Guild SET shouldReAnnounce = ? WHERE guildId = ?",
      [shouldReAnnounce ? 1 : 0, guildId]
    );
  }

  private addMultiMembersToQueue(guildId: string, members: string[]) {
    SQLiteAdapter.db
      ?.get("SELECT * FROM Guild WHERE guildId = ?", [guildId])
      .then((guildState) => {
        const guild = guildState as GuildTable | null;
        if (!guild) {
          return SQLiteAdapter.db?.run(
            "INSERT INTO Guild (guildId, queue) VALUES (?, ?)",
            [guildId, members.join(",")]
          );
        } else {
          const currentQueue = GuildTable.stringToArray(guild.queue ?? "");
          const updatedQueue = [...currentQueue, ...members]
            .filter((m) => !!m)
            .join(",");
          return SQLiteAdapter.db?.run(
            "UPDATE Guild SET queue = ? WHERE guildId = ?",
            [updatedQueue, guildId]
          );
        }
      })
      .catch((error) => {
        console.error("Failed to add members to queue:", error);
      });
  }

  public addMemberToQueue(guildId: string, member: string): void {
    this.checkAndCreateGuild(guildId);
    this.addMultiMembersToQueue(guildId, [member]);
  }

  public addMembersToQueue(guildId: string, members: string[]): void {
    this.checkAndCreateGuild(guildId);
    this.addMultiMembersToQueue(guildId, members);
  }

  public updateQueueIndex(guildId: string, index: number): void {
    SQLiteAdapter.db?.run("UPDATE Guild SET queueIndex = ? WHERE guildId = ?", [
      index,
      guildId,
    ]);
  }

  public resetQueue(guildId: string): void {
    SQLiteAdapter.db?.run(
      "UPDATE Guild SET queue = '', queueIndex = 0 WHERE guildId = ?",
      [guildId]
    );
  }

  public async removeMemberFromQueue(
    guildId: string,
    memberId: string
  ): Promise<void> {
    const guildState = await SQLiteAdapter.db?.get<GuildTable>(
      "SELECT * FROM Guild WHERE guildId = ?",
      [guildId]
    );

    if (!guildState) {
      console.error("Guild not found:", guildId);
      return;
    }

    const currentQueue = GuildTable.stringToArray(guildState.queue ?? "");
    const updatedQueue = currentQueue.filter((member) => member !== memberId);
    const updatedQueueString = GuildTable.arrayToString(updatedQueue);
    const updatedQueueIndex = Math.max(
      0,
      Math.min(guildState.queueIndex, updatedQueue.length - 1)
    );

    await SQLiteAdapter.db?.run(
      "UPDATE Guild SET queue = ?, queueIndex = ? WHERE guildId = ?",
      [updatedQueueString, updatedQueueIndex, guildId]
    );
  }
}
