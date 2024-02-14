const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
app.use(cors());
const app = express();
const port = 3001; // Виберіть бажаний порт

let browser;
let page;

app.use(bodyParser.json());

app.post("/drone-data", async (req, res) => {
  const droneData = req.body;
  if (
    !droneData.latitude ||
    !droneData.longitude ||
    !droneData.camera_pitch ||
    !droneData.camera_yaw ||
    !droneData.altitude
  ) {
    return res.status(400).send("Invalid drone data received");
  }
  try {
    const imageBase64 = await captureScreenshot(droneData);
    console.log("Screenshot captured successfully");

    res.status(200).send(imageBase64);
  } catch (error) {
    console.error("you got a 500 error", error);
    res.status(500).send("you got a 500 error");
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

async function startBrowserAndPage() {
  browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });
  page = await browser.newPage();
  await page.setViewport({ width: 720, height: 480 });
}

startBrowserAndPage();

async function updateURLHash(droneData) {
  const hash = `#${droneData.latitude},${droneData.longitude},${droneData.camera_pitch},${droneData.camera_yaw},${droneData.altitude}`;
  await page.evaluate((newHash) => {
    location.hash = newHash;
  }, hash);
}

async function captureScreenshot(droneData) {
  if (!page) {
    throw new Error("Browser page not initialized");
  }

  await updateURLHash(droneData);
  await page.waitForSelector("#mapLoadedElement", { timeout: 50000 });
  const filename = `screenshot-${Date.now()}.png`;
  await page.screenshot({ path: filename });
  const imageBuffer = fs.readFileSync(filename);
  const imageBase64 = imageBuffer.toString("base64");

  fs.unlinkSync(filename);
  return imageBase64;
}

// Важливі міркування:
//# Переконайтеся, що Viewport захоплює центр екрану, щоб уникнути відображення UI у стрічці
//# Частоту потрібно регулювати, відправляючи запити з клієнтської сторони
//# Пам'ятайте, що продуктивність може бути жахливою. Це не дуже ефективний інструмент
//# Можливо, існує спосіб зробити це за допомогою "History API", якщо ви побудуєте це як клієнтську сторону. Однак, тоді "Puppeteer" не буде використовуватися
//# Я не "Back-end Developer". Дивіться на цей код із скептицизмом