import { Clipboard, open, showToast, Toast } from "@raycast/api";
import { parse } from "node-html-parser";
import { COSENSE_BASE_URL, PROJECT_NAME } from "./constants";
import { type Result, unescapeHTML, validateUrl } from "./utils";

const PREFERRED_SY = 500;

const toSY = (url: string) => url.replace(/\._[^.]+_\.(jpg|jpeg|png|webp)(\?.*)?$/i, `._SY${PREFERRED_SY}_.$1$2`);

function simplifyAmazonUrl(url: URL): URL {
  const match = url.toString().match(/(\/dp\/\w+|\/gp\/product\/\w+)[/?]?/);
  return match ? new URL(url.origin + match[1]) : url;
}

async function fetchHtml(url: URL): Promise<Result<string>> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });
  return res.ok
    ? { ok: true, value: await res.text() }
    : { ok: false, error: new Error(`HTTP ${res.status}: ${res.url}`) };
}

function extractTitleFromHtml(html: string): Result<string> {
  const root = parse(html);
  const title = root.querySelector("#productTitle")?.text?.trim();
  return title
    ? { ok: true, value: title }
    : { ok: false, error: new Error("Could not find #productTitle in the HTML.") };
}

function extractImageSrcFromHtml(html: string): Result<string> {
  const root = parse(html);
  const raw = root.querySelector("#landingImage")?.getAttribute("data-a-dynamic-image");
  if (!raw) return { ok: false, error: new Error("Could not find data-a-dynamic-image on #landingImage.") };

  const map = JSON.parse(unescapeHTML(raw)) as Record<string, unknown>;
  const urls = Object.keys(map);
  const picked = urls.find((u) => u.includes(`_SY${PREFERRED_SY}_`)) ?? urls[0];
  return picked
    ? { ok: true, value: toSY(picked) }
    : { ok: false, error: new Error("No URLs were found in data-a-dynamic-image.") };
}

export default async function Command() {
  await showToast({ style: Toast.Style.Animated, title: "Creating Cosense page..." });
  const clipboardText = (await Clipboard.readText()) ?? "";
  const clipboardTextResult = validateUrl(clipboardText);
  if (!clipboardTextResult.ok) {
    console.error("Invalid URL in clipboard", clipboardTextResult.error.message);
    showToast(Toast.Style.Failure, "Invalid URL in clipboard", clipboardTextResult.error.message);
    return;
  }
  const url = clipboardTextResult.url;
  const simplifiedUrl = simplifyAmazonUrl(url);
  const htmlResult = await fetchHtml(simplifiedUrl);
  if (!htmlResult.ok) {
    console.error("Failed to fetch Amazon page", htmlResult.error.message);
    showToast(Toast.Style.Failure, "Failed to fetch Amazon page", htmlResult.error.message);
    return;
  }

  const titleResult = extractTitleFromHtml(htmlResult.value);
  if (!titleResult.ok) {
    console.error("Product title not found", titleResult.error.message);
    showToast(Toast.Style.Failure, "Product title not found", titleResult.error.message);
    return;
  }

  const imageResult = extractImageSrcFromHtml(htmlResult.value);
  if (!imageResult.ok) {
    console.error("Product image not found", imageResult.error.message);
    showToast(Toast.Style.Failure, "Product image not found", imageResult.error.message);
    return;
  }

  const body = `#ref/book\n[${titleResult.value} ${simplifiedUrl}]\n[${imageResult.value}]`;

  const cosenseUrl = `${COSENSE_BASE_URL}/${encodeURIComponent(PROJECT_NAME)}/${encodeURIComponent(titleResult.value)}?body=${encodeURIComponent(body)}`;
  await open(cosenseUrl);
}
