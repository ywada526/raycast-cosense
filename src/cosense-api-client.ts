import { useCachedPromise } from "@raycast/utils";
import assert from "assert";
import { COSENSE_API_BASE_URL, PROJECT_NAME } from "./constants";

export type Page = {
  id: string;
  title: string;
  lines: string[];
};

type SearchResponse = {
  pages: Page[];
};

export function useSearchQuery(query: string) {
  return useCachedPromise(
    async (query: string): Promise<SearchResponse> => {
      if (!query) return { pages: [] };
      const response = await fetch(
        `${COSENSE_API_BASE_URL}/pages/${PROJECT_NAME}/search/query?q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
      return await response.json();
    },
    [query],
    { keepPreviousData: true },
  );
}

export function usePageTextQuery(title?: string) {
  return useCachedPromise(
    async (title?: string): Promise<string | null> => {
      assert(title);

      const response = await fetch(`${COSENSE_API_BASE_URL}/pages/${PROJECT_NAME}/${encodeURIComponent(title)}/text`);
      if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
      return await response.text();
    },
    [title],
    { keepPreviousData: true, execute: !!title },
  );
}
