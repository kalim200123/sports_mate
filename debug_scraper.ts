import puppeteer from "puppeteer";

async function runDebug() {
  console.log("Starting Debug Scraper for WKBL...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // WKBL Schedule URL (Dec 2024)
  const url = "https://www.wkbl.or.kr/game/sch/schedule1.asp?bm_date=202412";
  console.log(`Navigating to ${url}`);

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  const content = await page.evaluate(() => {
    // Find any table
    const table = document.querySelector("table");
    if (!table) return { hasTable: false, message: "No table found" };

    // Get headers
    const headers = Array.from(table.querySelectorAll("th")).map((th) => th.innerText.trim());
    // Get first 5 rows
    const rows = Array.from(table.querySelectorAll("tr"))
      .slice(0, 10)
      .map((tr) => {
        return {
          html: tr.innerHTML.substring(0, 500), // Get HTML to check for links/images
          text: tr.innerText.replace(/\n/g, " | "),
        };
      });

    return {
      hasTable: true,
      headers,
      sampleRows: rows,
    };
  });

  console.log("WKBL Debug Result:");
  console.log(JSON.stringify(content, null, 2));

  await browser.close();
}

runDebug().catch(console.error);
