import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import puppeteer from "puppeteer";

export class ScraperService {
  /**
   * KOVO 공식 홈페이지에서 2025-2026 시즌 전체 일정을 크롤링하여 DB에 저장합니다.
   * Puppeteer를 사용하여 SPA 페이지를 렌더링 후 데이터를 추출합니다.
   */
  static async scrapeAndSaveMatches(): Promise<number> {
    // KOVO URL: 2025-2026 Season (Current Season Code: 022)
    const url = "https://kovo.co.kr/games/v-leagues/schedules?season=022&gender=all&league=201&round=all";
    console.log(`[Scraper] Launching Puppeteer for: ${url}`);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({ width: 1280, height: 800 });

      console.log("[Scraper] Navigating to page...");
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

      console.log("[Scraper] Waiting for selector and rendering...");
      await new Promise((r) => setTimeout(r, 5000)); // Safety wait for SPA rendering

      // Extract Data
      console.log("[Scraper] Extracting data...");

      interface ScrapedMatch {
        date: string;
        time: string;
        home: string;
        away: string;
        stadium: string;
        homeScore: number;
        awayScore: number;
      }

      const matches = await page.evaluate(() => {
        const results: ScrapedMatch[] = [];
        const dateRegex = /^\d{4}\.\d{2}\.\d{2}\s*\(.\)$/; // e.g. 2025.10.18 (토)

        // Find all spans that look like a date
        const spans = Array.from(document.querySelectorAll("span"));
        const dateSpans = spans.filter((s) => dateRegex.test((s as HTMLElement).innerText.trim()));

        for (const dateSpan of dateSpans) {
          const el = dateSpan as HTMLElement;
          const dateText = el.innerText.trim();

          // Find the Day Container (the common parent that holds Date and Matches)
          // Based on inspection: DayContainer > DateBlock | MatchBlock | MatchBlock ...

          let dayContainer = el.parentElement;

          // Ascend to find the wrapper that contains sibling match blocks
          // We look for a parent that has children with emblems
          for (let i = 0; i < 4; i++) {
            if (!dayContainer) break;

            // Check if this container has children that look like matches
            // A match block typically has at least 2 emblems
            const children = Array.from(dayContainer.children);
            const matchBlocks = children.filter((c) => c.querySelectorAll('img[src*="emblems"]').length >= 2);

            if (matchBlocks.length > 0) {
              // Found the container! Iterate over ALL match blocks inside it.
              for (const card of matchBlocks) {
                // Extract info from this specific card
                const cardSpans = Array.from(card.querySelectorAll("span"));

                // Time
                const timeEl = cardSpans.find((s) => /^\d{2}:\d{2}$/.test((s as HTMLElement).innerText.trim()));
                const time = timeEl ? (timeEl as HTMLElement).innerText.trim() : "00:00";

                // Teams
                const imgs = Array.from(card.querySelectorAll('img[src*="emblems"]'));
                if (imgs.length < 2) continue;

                const homeContainer = imgs[0].parentElement;
                const home = homeContainer ? homeContainer.innerText.trim() : "";
                const awayContainer = imgs[1].parentElement;
                const away = awayContainer ? awayContainer.innerText.trim() : "";

                // Scores
                let homeScore = 0;
                let awayScore = 0;

                const colonSpan = cardSpans.find((s) => s.innerText.trim() === ":");
                if (colonSpan) {
                  const prev = colonSpan.previousElementSibling as HTMLElement;
                  const next = colonSpan.nextElementSibling as HTMLElement;

                  if (prev && next) {
                    const hText = prev.innerText.trim();
                    const aText = next.innerText.trim();

                    if (/^\d+$/.test(hText) && /^\d+$/.test(aText)) {
                      const h = parseInt(hText);
                      const a = parseInt(aText);
                      if (h <= 5 && a <= 5) {
                        homeScore = h;
                        awayScore = a;
                      }
                    }
                  }
                }

                // Stadium
                let stadium = "Unknown";
                if (timeEl && timeEl.parentElement?.parentElement) {
                  const parentText = timeEl.parentElement.parentElement.innerText;
                  const lines = parentText
                    .split("\n")
                    .map((l) => l.trim())
                    .filter((l) => l !== time && l.length > 2);
                  if (lines.length > 0) stadium = lines[0];
                }

                results.push({ date: dateText, time, home, away, stadium, homeScore, awayScore });
              }
              break;
            }
            dayContainer = dayContainer.parentElement;
          }
        }

        return results;
      });

      console.log(`[Scraper] Extracted ${matches.length} preliminary items.`);

      let savedCount = 0;
      for (const m of matches) {
        if (!m.home || !m.away || !m.date) continue;

        // Parse Date
        const dateClean = m.date.replace(/\(.\)/, "").trim();
        const [yyyy, mm, dd] = dateClean.split(".");

        if (!yyyy || !mm || !dd) continue;

        const dateStr = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
        const timeStr = m.time.length === 5 ? m.time + ":00" : "19:00:00";
        const fullDateTime = `${dateStr} ${timeStr}`;

        // Status Logic
        const matchTime = new Date(fullDateTime).getTime();
        const now = Date.now();
        const diffHours = (now - matchTime) / (1000 * 60 * 60);

        let status = "SCHEDULED";
        if (diffHours > 3) {
          status = "COMPLETED";
        } else if (diffHours >= 0) {
          status = "LIVE";
        }

        // Check DB - Modified to check exact time match to handle same-day multiple matches
        const checkQuery = "SELECT id FROM matches WHERE match_date = ? AND home_team = ?";
        const [rows] = await pool.query<RowDataPacket[]>(checkQuery, [fullDateTime, m.home]);

        if (rows.length === 0) {
          // New Match
          await pool.query(
            `INSERT INTO matches
            (match_date, home_team, away_team, location, home_score, away_score, status, sport, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'VOLLEYBALL', NOW())`,
            [fullDateTime, m.home, m.away, m.stadium || "Unknown", m.homeScore, m.awayScore, status]
          );
          savedCount++;
        } else {
          // Existing Match - Update Score & Status
          // Only update if score changed or status changed to avoid unnecessary writes?
          // For simplicity, just update.
          await pool.query(`UPDATE matches SET home_score = ?, away_score = ?, status = ? WHERE id = ?`, [
            m.homeScore,
            m.awayScore,
            status,
            rows[0].id,
          ]);
          // Don't increment savedCount for updates, or maybe track updatedCount?
        }
      }

      console.log(`[Scraper] Successfully saved ${savedCount} matches.`);
      return savedCount;
    } catch (error) {
      console.error("[Scraper] Puppeteer Error:", error);
      throw error;
    } finally {
      if (browser) await browser.close();
    }
  }
}
