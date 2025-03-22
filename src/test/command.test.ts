import { ChatInputCommandInteraction, CommandInteraction } from "discord.js";
import { handleCommand } from "../interactions/command";
import { COMMANDS } from "../constants/commands";
import { GlobalState } from "../globalState";
import { getGuildMembers } from "../util";
import { MOCKED_DATA, NORMAL_USER_1, NORMAL_USER_2 } from "./data";

jest.mock("../util.ts", () => {
  return {
    ...jest.requireActual("../util.ts"),
    isPassPrecheck: jest.fn().mockReturnValue(null),
    getGuildMembers: jest.fn().mockResolvedValue([]),
  };
});

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
    expect(guildState.getMembersInQueue()).toHaveLength(
      MOCKED_DATA.MEMBERS.length
    );
    expect(guildState.getQueue()).toHaveLength(MOCKED_DATA.MEMBERS.length);

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
    expect(guildState.getMembersInQueue()).toHaveLength(
      MOCKED_DATA.MEMBERS.length
    );
    expect(guildState.getQueue()).toHaveLength(MOCKED_DATA.MEMBERS.length);

    guildState.moveNext();
    expect(guildState.getNextMember()).toBe(MOCKED_DATA.MEMBERS[1]);

    handleCommand(mockedInteraction, globalState);

    expect(guildState.getMembersInQueue()).toHaveLength(
      MOCKED_DATA.MEMBERS.length
    );
    expect(guildState.getQueue()).toHaveLength(MOCKED_DATA.MEMBERS.length);
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

  describe("Add members", () => {
    it("Show show no members found message", async () => {
      const mockedInteraction = generateInteraction(COMMANDS.ADD);

      await handleCommand(mockedInteraction, globalState);

      expect(mockedInteraction.editReply).toHaveBeenCalledWith(
        "No members found or all members are joined"
      );
    });

    it("Should show list of members to add", async () => {
      (getGuildMembers as jest.Mock).mockResolvedValue([
        NORMAL_USER_1,
        NORMAL_USER_2,
      ]);

      const mockedInteraction = generateInteraction(COMMANDS.ADD);

      await handleCommand(mockedInteraction, globalState);

      expect(mockedInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Select a member from the dropdown:",
        })
      );
    });
  });

  describe("Remove members", () => {
    it("Should show no members found message", async () => {
      (getGuildMembers as jest.Mock).mockResolvedValue([
        NORMAL_USER_1,
        NORMAL_USER_2,
      ]);

      const mockedInteraction = generateInteraction(COMMANDS.REMOVE);

      await handleCommand(mockedInteraction, globalState);

      expect(mockedInteraction.editReply).toHaveBeenCalledWith(
        "No members found or there's no member to remove"
      );
    });

    it("Should show list of members to remove", async () => {
      (getGuildMembers as jest.Mock).mockResolvedValue([
        NORMAL_USER_1,
        NORMAL_USER_2,
      ]);

      const guildState = globalState.get(MOCKED_DATA.INTERACT_GUILD_ID);

      MOCKED_DATA.MEMBERS.forEach((member) => guildState.addMember(member));

      const mockedInteraction = generateInteraction(COMMANDS.REMOVE);

      await handleCommand(mockedInteraction, globalState);

      expect(mockedInteraction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: "Select a member from the dropdown:",
        })
      );
    });
  });

  it("Should show the invite link on /get_invite_link command", () => {
    const mockedInteraction = generateInteraction(COMMANDS.GET_INVITE_LINK);

    handleCommand(mockedInteraction, globalState);

    expect(mockedInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining("here is the invite link")
    );
  });

  it("Should show selections for /set_weekly_time command", async () => {
    const mockedInteraction = generateInteraction(COMMANDS.SET_WEEKLY_TIME);

    await handleCommand(mockedInteraction, globalState);

    expect(mockedInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Select all days that you want to announce:",
      })
    );
  });

  it("Should show the weekly time on /view_weekly_time command", () => {
    const mockedInteraction = generateInteraction(COMMANDS.VIEW_WEEKLY_TIME);

    handleCommand(mockedInteraction, globalState);

    expect(mockedInteraction.reply).toHaveBeenCalledWith(
      expect.stringContaining("Weekly time to announce:")
    );
  });
});
