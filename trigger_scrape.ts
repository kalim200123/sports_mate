import axios from "axios";

async function seedSeason() {
  const baseUrl = "http://localhost:3000/api/admin/scrape";
  // 2025-10 to 2026-03
  // Puppeteer scraper gets the full season at once
  try {
    console.log(`Triggering full season scrape...`);
    const response = await axios.post(`${baseUrl}?year=2025&month=all`); // Params ignored inside service
    console.log(`Result: ${JSON.stringify(response.data)}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to scrape:`, message);
  }
}

seedSeason();
