export const ENV_VARIABLES = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN ?? "",
  MOCK_GUILD_ID: process.env.MOCK_GUILD_ID ?? "",
  MOCK_MEMBER_IDS: process.env.MOCK_MEMBER_IDS?.split(",") || [],
  MOCK_CHANNEL_ID: process.env.MOCK_CHANNEL_ID ?? "",
  MODE: process.env.MODE ?? "production",
  INVITE_LINK: process.env.INVITE_LINK ?? "",
};
