import { WEEKLY_DAYS } from "../constants/time";

export const NORMAL_USER_1 = {
  id: "385806552163942411",
  user: {
    bot: false,
    username: "Duc_Dauuu",
  },
};

export const NORMAL_USER_2 = {
  id: "557718978521202688",
  user: {
    bot: false,
    username: "MEOW",
  },
};

export const BOT_USER = {
  id: "1347614549699727432",
  user: {
    bot: true,
    username: "MEOW_BOT",
  },
};

export const MOCKED_DATA = {
  MEMBERS: [NORMAL_USER_1.id, NORMAL_USER_2.id],
  WEEKLY_TIME: [WEEKLY_DAYS[0], WEEKLY_DAYS[1]],
  INTERACT_USER_ID: "2222",
  INTERACT_GUILD_ID: "1111",
  INTERACT_CHANNEL_ID: "3333",
};
