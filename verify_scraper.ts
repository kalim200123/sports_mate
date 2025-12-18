import "dotenv/config";
import { ScraperService } from "./src/services/scraper.service";

async function runTest() {
  console.log("Running WKBL Scraper Test...");
  const wkblCount = await ScraperService.scrapeBasketballMatches("wkbl");
  console.log(`WKBL Matches Saved: ${wkblCount}`);

  console.log("Running KBL Scraper Test...");
  const kblCount = await ScraperService.scrapeBasketballMatches("kbl");
  console.log(`KBL Matches Saved: ${kblCount}`);

  process.exit(0);
}

runTest().catch(console.error);
