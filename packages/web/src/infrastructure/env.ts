import { cleanEnv, str } from "envalid";

const envSpecs = {
  VITE_API_URL: str(),
};

export const envPublic = cleanEnv(
  {
    VITE_API_URL: import.meta.env.VITE_API_URL,
  },

  {
    ...envSpecs,
  },
);
