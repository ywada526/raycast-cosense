import { getPreferenceValues } from "@raycast/api";

export const COSENSE_BASE_URL = "https://scrapbox.io";
export const COSENSE_API_BASE_URL = `${COSENSE_BASE_URL}/api`;
export const PROJECT_NAME = getPreferenceValues()["projectName"];
