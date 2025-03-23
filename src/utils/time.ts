import { TIME_INPUT_FORMAT_REGEX } from "../constants/regex";

export const extractTimeFromInput = (timeInput: string) => {
  const time = timeInput.match(TIME_INPUT_FORMAT_REGEX);

  if (!time) return null;

  return time[0].split(":");
};

export const weekTimeToSelections = (time: string[], selected: string[]) => {
  return time.map((t) => {
    return {
      label: t,
      value: t,
      default: selected.includes(t),
    };
  });
};
