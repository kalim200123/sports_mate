import * as fs from "fs";
import puppeteer from "puppeteer";

async function debugKovo() {
  const url = "https://kovo.co.kr/games/v-leagues/schedules?season=022&gender=all&league=201&round=all";
  // Try Season 021 (2024-2025) if 022 is expected to be empty in reality
  // const url = 'https://kovo.co.kr/games/v-leagues/schedules?season=021&gender=all&league=201&round=all';

  console.log(`Debug Puppeteer: ${url}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Wait a bit more for rendering
    await new Promise((r) => setTimeout(r, 5000));

    const content = await page.content();
    fs.writeFileSync("kovo_puppeteer.html", content);
    console.log("Saved content to kovo_puppeteer.html");

    // Quick probe for "정관장"
    if (content.includes("정관장")) {
      console.log('Found "정관장" in content!');
    } else {
      console.log('Did NOT find "정관장". Maybe wrong season or selector issue?');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

debugKovo();
