import { Action, ActionPanel, List, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { COSENSE_BASE_URL, PROJECT_NAME } from "./constants";
import { usePageTextQuery, useSearchQuery } from "./cosense-api-client";
import { cosenseToMarkdown } from "./scrapbox-to-markdown";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: searchQueryResult, isLoading: isSearchQueryLoading } = useSearchQuery(searchText);

  const pages = searchQueryResult?.pages ?? [];
  const selectedPageTitle = pages.find((page) => page.id === selectedId)?.title;

  const { data: pageTextQueryResult, isLoading: isPageTextQueryLoading } = usePageTextQuery(selectedPageTitle);

  return (
    <List
      isLoading={isSearchQueryLoading}
      isShowingDetail
      searchText={searchText}
      onSearchTextChange={setSearchText}
      selectedItemId={selectedId ?? undefined}
      onSelectionChange={setSelectedId}
    >
      {pages.map((page) => (
        <List.Item
          key={page.id}
          id={page.id}
          title={page.title}
          subtitle={page.lines.join(" ")}
          detail={
            <List.Item.Detail
              isLoading={isPageTextQueryLoading}
              markdown={convertCosenseToMarkdown(pageTextQueryResult ?? undefined)}
            />
          }
          actions={
            <ActionPanel>
              <Action.Open
                title="Open in Browser"
                target={`${COSENSE_BASE_URL}/${encodeURIComponent(PROJECT_NAME)}/${encodeURIComponent(page.title)}`}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function convertCosenseToMarkdown(text?: string): string {
  if (!text) return "";
  const { markdown, error } = cosenseToMarkdown(text);
  if (error) {
    showToast(Toast.Style.Failure, "Failed to convert Cosense to Markdown", error.message);
  }
  return markdown;
}
