import { ChatInputCommandInteraction, CommandInteraction } from "discord.js";
import { handleCommand } from "../interactions/command";
import { COMMANDS } from "../constants/commands";
import { GlobalState } from "../globalState";

jest.mock("../util.ts", () => {
  return {
    ...jest.requireActual("../util.ts"),
    isPassPrecheck: jest.fn().mockReturnValue(null),
  };
});

const MOCKED_DATA = {
  MEMBERS: ["1234", "5678", "91011"],
  INTERACT_USER_ID: "2222",
  INTERACT_GUILD_ID: "1111",
  INTERACT_CHANNEL_ID: "3333",
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

const generateInteraction = (
  commandName: string,
  extraParams?: DeepPartial<CommandInteraction>
) =>
  ({
    editReply: jest.fn(),
    deferReply: jest.fn(),
    reply: jest.fn(),
    user: MOCKED_DATA.INTERACT_USER_ID,
    guildId: MOCKED_DATA.INTERACT_GUILD_ID,
    channelId: MOCKED_DATA.INTERACT_CHANNEL_ID,
    commandName,
    ...extraParams,
  } as unknown as CommandInteraction);

describe("Commands", () => {
  let globalState: GlobalState<string>;

  beforeEach(() => {
    globalState = new GlobalState<string>();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should return accept message on /accept command", () => {
    // Arrange
    const mockedInteraction = generateInteraction(COMMANDS.ACCEPT);

    handleCommand(mockedInteraction, globalState);

    expect(mockedInteraction.reply).toHaveBeenCalledWith(
      `<@${MOCKED_DATA.INTERACT_USER_ID}> accept today turn`
    );
  });

  it("Should return config channel message on /config_channel command", () => {
    // Arrange
    const mockedInteraction = generateInteraction(COMMANDS.CONFIG_CHANNEL);
    const guildState = globalState.get(MOCKED_DATA.INTERACT_GUILD_ID);

    expect(guildState.getAnnounceChannel()).toBeNull();

    handleCommand(mockedInteraction, globalState);

    expect(guildState.getAnnounceChannel()).toBe(
      MOCKED_DATA.INTERACT_CHANNEL_ID
    );

    expect(mockedInteraction.reply).toHaveBeenCalledWith(
      "Config the channel to announce success!"
    );
  });

  it("Should return list of members on /list command", () => {
    // Arrange
    const mockedInteraction = generateInteraction(COMMANDS.LIST);
    const guildState = globalState.get(MOCKED_DATA.INTERACT_GUILD_ID);

    MOCKED_DATA.MEMBERS.forEach((member) => guildState.addMember(member));

    handleCommand(mockedInteraction, globalState);

    expect(mockedInteraction.reply).toHaveBeenCalledWith(
      `Queue list: <@${MOCKED_DATA.MEMBERS.join(">, <@")}>`
    );
  });

  it("Should reset the queue list on /reset command", () => {
    const mockedInteraction = generateInteraction(COMMANDS.RESET);
    const guildState = globalState.get(MOCKED_DATA.INTERACT_GUILD_ID);

    MOCKED_DATA.MEMBERS.forEach((member) => guildState.addMember(member));
    expect(guildState.getMembersInQueue()).toHaveLength(3);
    expect(guildState.getQueue()).toHaveLength(3);

    handleCommand(mockedInteraction, globalState);

    expect(guildState.getMembersInQueue()).toHaveLength(0);
    expect(guildState.getQueue()).toHaveLength(0);
    expect(mockedInteraction.reply).toHaveBeenCalledWith(
      "Reset the queue list success!"
    );
  });

  it("Should start over the queue on /start_over command", () => {
    const mockedInteraction = generateInteraction(COMMANDS.START_OVER);
    const guildState = globalState.get(MOCKED_DATA.INTERACT_GUILD_ID);

    MOCKED_DATA.MEMBERS.forEach((member) => guildState.addMember(member));
    expect(guildState.getMembersInQueue()).toHaveLength(3);
    expect(guildState.getQueue()).toHaveLength(3);

    guildState.moveNext();
    expect(guildState.getNextMember()).toBe(MOCKED_DATA.MEMBERS[1]);

    handleCommand(mockedInteraction, globalState);

    expect(guildState.getMembersInQueue()).toHaveLength(3);
    expect(guildState.getQueue()).toHaveLength(3);
    expect(guildState.getNextMember()).toBe(MOCKED_DATA.MEMBERS[0]);

    expect(mockedInteraction.reply).toHaveBeenCalledWith(
      "Start over the queue success!"
    );
  });

  it("Should return skip message on /skip command", () => {
    const mockedInteraction = generateInteraction(COMMANDS.SKIP);
    const guildState = globalState.get(MOCKED_DATA.INTERACT_GUILD_ID);

    MOCKED_DATA.MEMBERS.forEach((member) => guildState.addMember(member));

    const currentMember = guildState.getPreviousMember();
    expect(guildState.shouldReAnnounce).toBeFalsy();

    handleCommand(mockedInteraction, globalState);

    expect(guildState.shouldReAnnounce).toBeTruthy();
    expect(mockedInteraction.reply).toHaveBeenCalledWith(
      `<@${currentMember}> has skipped today's turn.`
    );
  });

  describe("Set reminder time", () => {
    const mockedInteractionWithTimeInput = (input: string | null) => {
      return generateInteraction(COMMANDS.SET_REMINDER_TIME, {
        isChatInputCommand: jest.fn().mockReturnValue(true),
        options: {
          getString: jest.fn().mockReturnValue(input),
        } as Partial<ChatInputCommandInteraction["options"]>,
      });
    };

    it("Should show required message", () => {
      const mockedInteraction = mockedInteractionWithTimeInput(null);

      handleCommand(mockedInteraction, globalState);

      expect(mockedInteraction.reply).toHaveBeenCalledWith(
        "Please provide the time to set the reminder"
      );
    });

    it("Should show invalid format error", () => {
      const mockedInteraction =
        mockedInteractionWithTimeInput("invalid_format");

      handleCommand(mockedInteraction, globalState);

      expect(mockedInteraction.reply).toHaveBeenCalledWith(
        "Invalid time format, please use HH:mm format (e.g. 14:00)"
      );
    });

    it("Should show invalid format error on invalid time", () => {
      const mockedInteraction = mockedInteractionWithTimeInput("25:00");

      handleCommand(mockedInteraction, globalState);

      expect(mockedInteraction.reply).toHaveBeenCalledWith(
        "Invalid time format, please use HH:mm format (e.g. 14:00)"
      );
    });

    it("Should set reminder time on valid time", () => {
      const mockedInteraction = mockedInteractionWithTimeInput("14:00");
      const guildState = globalState.get(MOCKED_DATA.INTERACT_GUILD_ID);

      expect(guildState.getReminderTime()).toBe("11:00"); // 11:00 is the default reminder time

      handleCommand(mockedInteraction, globalState);

      expect(guildState.getReminderTime()).toBe("14:00");
      expect(mockedInteraction.reply).toHaveBeenCalledWith(
        "Set the reminder time to 14:00 everyday"
      );
    });
  });
});
