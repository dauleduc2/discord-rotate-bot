import { db } from "..";
import { ENV_VARIABLES } from "../constants/envVariables";
import { GlobalState } from "../store/globalState";
import { GuildState } from "../store/guildState";

export const mockTestData = (state: GlobalState<string>) => {
  const mockGuildState = new GuildState<string>(
    {
      guildId: ENV_VARIABLES.MOCK_GUILD_ID,
    },
    db
  );

  ENV_VARIABLES.MOCK_MEMBER_IDS.forEach((memberId) => {
    mockGuildState.addMember(memberId);
  });

  mockGuildState.setAnnounceChannel(ENV_VARIABLES.MOCK_CHANNEL_ID);

  state.set(ENV_VARIABLES.MOCK_GUILD_ID, mockGuildState);
};
