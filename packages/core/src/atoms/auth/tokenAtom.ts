import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { getAsyncStorage } from "../../utils/storage";

export const tokenAtom = atomWithStorage<string | null>(
  "token",
  null,
  createJSONStorage<string | null>(getAsyncStorage),
);
