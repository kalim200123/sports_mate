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
  /**
   * 네이버 스포츠(e.g. m.sports.naver.com)에서 농구 경기 일정 크롤링
   * category: 'kbl' | 'wkbl'
   * date: 'YYYY-MM-DD' (해당 월의 데이터를 가져옴)
   */
  static async scrapeBasketballMatches(category: "kbl" | "wkbl"): Promise<number> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      let totalSaved = 0;

      if (category === "wkbl") {
        // WKBL: Nov 2025 to April 2026
        const months = ["202511", "202512", "202601", "202602", "202603", "202604"];

        for (const yyyymm of months) {
          const url = `https://www.wkbl.or.kr/game/sch/schedule1.asp?gun=1&season_gu=046&ym=${yyyymm}`;
          console.log(`[Scraper] WKBL - Navigating to ${url}`);

          await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

          // Extract Data: Scan ALL rows
          const matches = await page.evaluate(() => {
            const results: any[] = [];
            const allRows = Array.from(document.querySelectorAll("tr"));

            for (const tr of allRows) {
              const tds = Array.from(tr.querySelectorAll("td"));
              if (tds.length < 4) continue;

              // Date: "11/16(일)"
              const dateText = tds[0].innerText.trim();
              const dateMatch = dateText.match(/^(\d+)\/(\d+)/);
              if (!dateMatch) {
                console.log("Row skipped: invalid date");
                continue;
              }

              const month = dateMatch[1].padStart(2, "0");
              const day = dateMatch[2].padStart(2, "0");

              // Teams: .team_versus > .info_team
              const versusDiv = tds[1].querySelector(".team_versus");
              if (!versusDiv) {
                console.log("Row skipped: no versus");
                continue;
              }

              const teams = Array.from(versusDiv.querySelectorAll(".info_team"));
              if (teams.length < 2) continue;

              const homeNode = teams[0];
              const awayNode = teams[1];

              const homeName = homeNode.querySelector(".team_name")?.textContent?.trim() || "";
              const homeScoreText = homeNode.querySelector(".txt_score")?.textContent?.trim() || "0";

              const awayName = awayNode.querySelector(".team_name")?.textContent?.trim() || "";
              const awayScoreText = awayNode.querySelector(".txt_score")?.textContent?.trim() || "0";

              const stadium = tds[2].innerText.trim();
              const time = tds[3].innerText.trim(); // "14:25"

              results.push({
                month,
                day,
                home: homeName,
                away: awayName,
                homeScore: parseInt(homeScoreText) || 0,
                awayScore: parseInt(awayScoreText) || 0,
                stadium,
                time,
              });
            }
            return results;
          });

          console.log(`[Scraper] Found ${matches.length} matches for WKBL ${yyyymm}`);

          for (const m of matches) {
            try {
              const year = yyyymm.substring(0, 4);
              const dateStr = `${year}-${m.month}-${m.day}`;
              const timeStr = m.time.includes(":") ? `${m.time}:00` : "00:00:00";
              const fullDateTime = `${dateStr} ${timeStr}`;

              console.log(`Processing match: ${m.home} vs ${m.away} on ${fullDateTime}`);

              const matchTime = new Date(fullDateTime).getTime();
              const now = Date.now();
              let status = "SCHEDULED";

              // Logic: Score exists?
              if (m.homeScore > 0 || m.awayScore > 0) {
                if (now - matchTime > 3 * 60 * 60 * 1000) status = "COMPLETED";
                else if (now > matchTime) status = "LIVE";
              } else {
                if (now - matchTime > 3 * 60 * 60 * 1000) status = "COMPLETED"; // Assume done if time passed
              }

              // DB Upsert
              const [existing] = await pool.query<RowDataPacket[]>(
                `SELECT id FROM matches WHERE match_date = ? AND home_team = ? AND sport = 'BASKETBALL'`,
                [fullDateTime, m.home]
              );

              console.log(`Existing count: ${existing.length}`);

              if (existing.length === 0) {
                await pool.query(
                  `INSERT INTO matches (match_date, home_team, away_team, location, home_score, away_score, status, sport, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [fullDateTime, m.home, m.away, m.stadium, m.homeScore, m.awayScore, status, "BASKETBALL", new Date()]
                );
                totalSaved++;
              } else {
                await pool.query(`UPDATE matches SET home_score=?, away_score=?, status=? WHERE id=?`, [
                  m.homeScore,
                  m.awayScore,
                  status,
                  existing[0].id,
                ]);
              }
            } catch (error) {
              console.error("Error processing match:", error);
            }
          }
        }
        return totalSaved;
      }

      // KBL Logic
      if (category === "kbl") {
        const url = "https://kbl.or.kr/match/schedule";
        console.log(`[Scraper] KBL - Navigating to ${url}`);

        await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

        // Wait for initial load
        try {
          await page.waitForSelector(".date", { timeout: 10000 });
        } catch {
          console.log("[Scraper] KBL - .date selector timeout");
        }

        // KBL targets: Sep 2025 -> Apr 2026
        const targetMonths = ["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04"];

        for (const target of targetMonths) {
          // Navigate to target month
          console.log(`[Scraper] KBL - Seeking ${target}...`);
          let attempts = 0;
          while (attempts < 20) {
            // Get current displayed month
            const currentText = await page.evaluate(() => {
              const els = document.querySelectorAll(".date p, .date span, ul.date li p"); // Try multiple
              for (const el of Array.from(els)) {
                if (/20\d\d\s*\.?\s*\d{1,2}/.test((el as HTMLElement).innerText)) return (el as HTMLElement).innerText;
              }
              return "";
            });

            // Parse "2025. 12" or "2025.12"
            const normalizedCurrent = currentText.replace(/[^\d]/g, ""); // 202512
            const normalizedTarget = target.replace(/-/g, ""); // 202512

            if (!normalizedCurrent) {
              console.log("[Scraper] KBL - Could not read current date.");
              break;
            }

            if (normalizedCurrent === normalizedTarget) {
              break; // Arrived
            }

            // Determine direction
            const curY = parseInt(normalizedCurrent.substring(0, 4));
            const curM = parseInt(normalizedCurrent.substring(4));
            const tarY = parseInt(normalizedTarget.substring(0, 4));
            const tarM = parseInt(normalizedTarget.substring(4));

            const diff = tarY * 12 + tarM - (curY * 12 + curM);

            if (diff < 0) {
              // Go Prev
              await page.click("button[title='이전으로']");
            } else {
              // Go Next
              await page.click("button[title='다음으로']");
            }

            await new Promise((r) => setTimeout(r, 1000)); // Wait for transition
            attempts++;
          }

          // Scrape current month
          const scrapedMatches = await page.evaluate(() => {
            const results: any[] = [];
            const dayContainers = Array.from(document.querySelectorAll("div[id^='game-']"));

            for (const container of dayContainers) {
              const id = container.id;
              const dateStr = id.replace("game-", "");
              if (dateStr.length !== 8) continue;

              const yyyy = dateStr.substring(0, 4);
              const mm = dateStr.substring(4, 6);
              const dd = dateStr.substring(6, 8);
              const fullDate = `${yyyy}-${mm}-${dd}`;

              const matchItems = Array.from(container.querySelectorAll(":scope > ul > li"));

              for (const item of matchItems) {
                const labelEl = item.querySelector(".sub .desc .label");
                const labelText = labelEl ? labelEl.textContent?.trim() || "" : "";
                if (labelText.includes("D리그")) continue;

                const metaLis = item.querySelectorAll(".sub .desc > ul > li");
                let time = "00:00";
                let stadium = "Unknown";
                if (metaLis.length >= 1) time = metaLis[0].textContent?.trim() || "00:00";
                if (metaLis.length >= 2) stadium = metaLis[1].textContent?.trim() || "Unknown";

                const teamLis = Array.from(item.querySelectorAll(".info .versus > li"));
                if (teamLis.length < 2) continue;

                const homeLi = teamLis[0];
                const awayLi = teamLis[1];

                const home = homeLi.querySelector("div p")?.textContent?.trim() || "";
                const away = awayLi.querySelector("div p")?.textContent?.trim() || "";

                const homeScoreP = homeLi.querySelector(":scope > p");
                const awayScoreP = awayLi.querySelector(":scope > p");

                let homeScore = 0;
                let awayScore = 0;
                if (homeScoreP && awayScoreP && homeScoreP.textContent && awayScoreP.textContent) {
                  homeScore = parseInt(homeScoreP.textContent.trim()) || 0;
                  awayScore = parseInt(awayScoreP.textContent.trim()) || 0;
                }

                let status = "SCHEDULED";
                const hasScore = homeScore > 0 || awayScore > 0;
                const isFinished =
                  homeLi.classList.contains("win") ||
                  homeLi.classList.contains("lose") ||
                  awayLi.classList.contains("win") ||
                  awayLi.classList.contains("lose");

                if (isFinished && hasScore) {
                  status = "COMPLETED";
                } else if (hasScore) {
                  status = "LIVE";
                }

                if (home && away) {
                  results.push({ date: fullDate, time, home, away, homeScore, awayScore, stadium, status });
                }
              }
            }
            return results;
          });

          console.log(`[Scraper] Found ${scrapedMatches.length} matches for KBL ${target}`);

          for (const m of scrapedMatches) {
            const matchDateTime = `${m.date} ${m.time}:00`;
            // Use more specific deduplication
            const [existing] = await pool.query<RowDataPacket[]>(
              `SELECT id FROM matches WHERE match_date = ? AND home_team = ? AND sport='BASKETBALL'`,
              [matchDateTime, m.home]
            );

            if (existing.length === 0) {
              await pool.query(
                `INSERT INTO matches (match_date, home_team, away_team, location, home_score, away_score, status, sport, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [matchDateTime, m.home, m.away, m.stadium, m.homeScore, m.awayScore, m.status, "BASKETBALL", new Date()]
              );
              totalSaved++;
            } else {
              await pool.query(`UPDATE matches SET home_score=?, away_score=?, status=? WHERE id=?`, [
                m.homeScore,
                m.awayScore,
                m.status,
                existing[0].id,
              ]);
            }
          }
        }
        return totalSaved;
      }
      return 0;
    } catch (e) {
      console.error(e);
      return 0;
    } finally {
      if (browser) await browser.close();
    }
  }
}
