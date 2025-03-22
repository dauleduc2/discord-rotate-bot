import { StringSelectMenuInteraction } from "discord.js";
import { MOCKED_DATA } from "./data";
import { GlobalState } from "../globalState";
import { INTERACTIONS } from "../constants/commands";
import { handleSelectStringMenu } from "../interactions/stringMenu";

const generateInteraction = (
  customId: string,
  extraParams?: DeepPartial<StringSelectMenuInteraction>
) =>
  ({
    editReply: jest.fn(),
    deferReply: jest.fn(),
    reply: jest.fn(),
    user: MOCKED_DATA.INTERACT_USER_ID,
    guild: {
      id: MOCKED_DATA.INTERACT_GUILD_ID,
    },
    customId,
    ...extraParams,
  } as unknown as StringSelectMenuInteraction);

describe("StringMenu", () => {
  let globalState: GlobalState<string>;

  beforeEach(() => {
    globalState = new GlobalState<string>();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Add member", () => {
    it("Select already exist member", async () => {
      const mockedInteraction = generateInteraction(INTERACTIONS.ADD_MEMBER, {
        values: [MOCKED_DATA.MEMBERS[0]],
      });

      const guildState = globalState.get(MOCKED_DATA.INTERACT_GUILD_ID);
      MOCKED_DATA.MEMBERS.forEach((memberId) => guildState.addMember(memberId));

      await handleSelectStringMenu(mockedInteraction, globalState);

      expect(mockedInteraction.reply).toHaveBeenCalledWith({
        content: "One or more member already exist",
      });
    });

    it("Select new member success", async () => {
      const mockedInteraction = generateInteraction(INTERACTIONS.ADD_MEMBER, {
        values: [MOCKED_DATA.MEMBERS[0]],
      });

      await handleSelectStringMenu(mockedInteraction, globalState);

      expect(mockedInteraction.reply).toHaveBeenCalledWith({
        embeds: expect.any(Array),
      });
    });
  });

  describe("Remove member", () => {
    it("Remove member success", async () => {
      const mockedInteraction = generateInteraction(
        INTERACTIONS.REMOVE_MEMBER,
        {
          values: [MOCKED_DATA.MEMBERS[0]],
        }
      );

      const guildState = globalState.get(MOCKED_DATA.INTERACT_GUILD_ID);

      guildState.addMember(MOCKED_DATA.MEMBERS[0]);

      await handleSelectStringMenu(mockedInteraction, globalState);

      expect(mockedInteraction.reply).toHaveBeenCalledWith({
        embeds: expect.any(Array),
      });
    });
  });

  it("Set weekly time", async () => {
    const mockedInteraction = generateInteraction(
      INTERACTIONS.WEEKLY_TIME_INPUT,
      {
        values: MOCKED_DATA.WEEKLY_TIME,
      }
    );

    await handleSelectStringMenu(mockedInteraction, globalState);

    expect(mockedInteraction.reply).toHaveBeenCalledWith({
      embeds: expect.any(Array),
    });
  });
});
