import axios from "axios";
import * as fs from "fs";

async function checkNaverIndex() {
  // User suggested: https://sports.news.naver.com/volleyball/schedule/index
  const url = "https://sports.news.naver.com/volleyball/schedule/index?year=2025&month=12&category=kovo";
  console.log(`Fetching: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    console.log("Status:", response.status);
    const html = response.data;

    // const fs = require("fs"); // This line was removed as per instruction
    fs.writeFileSync("naver_dump.html", response.data);
    console.log("Saved HTML to naver_dump.html");

    // Check for specific team names to see if data is pre-rendered
    if (response.data.includes("정관장") || response.data.includes("흥국생명")) {
      console.log("Found team names in HTML! Data IS present.");
    } else {
      console.log("Team names NOT found. Pure SPA or blocking.");
    }

    // Check if "scheduleList" or "teams" are mentioned in the HTML
    if (html.includes("scheduleList")) {
      console.log('Found "scheduleList" in HTML! It might be embedded in a script.');
      const snippet = html.split("scheduleList")[1].substring(0, 200);
      console.log("Snippet:", snippet);
    } else if (html.includes("tbl_schedule")) {
      console.log('Found "tbl_schedule" table in HTML! It might be SSR HTML.');
    } else {
      console.log("Could not find obvious schedule data patterns in HTML.");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error:", message);
  }
}

checkNaverIndex();
