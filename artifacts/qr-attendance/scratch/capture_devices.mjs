import { spawn } from "child_process";
import fs from "fs";

async function run() {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless",
    "--disable-gpu",
    "--remote-debugging-port=9333",
    "about:blank"
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch("http://localhost:9333/json");
    const pages = await listRes.json();
    const page = pages[0];
    const wsUrl = page.webSocketDebuggerUrl;

    // Use native WebSocket in Node 22+
    const ws = new WebSocket(wsUrl);
    await new Promise(res => { ws.onopen = res; });

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const onMessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === msgId) {
            ws.removeEventListener("message", onMessage);
            resolve(msg.result);
          }
        };
        ws.addEventListener("message", onMessage);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send("Page.enable");

    const devices = [
      { name: "desktop_1440", width: 1440, height: 900, dpr: 1, mobile: false },
      { name: "iphone_15_pro_390", width: 390, height: 844, dpr: 2, mobile: true },
      { name: "pixel_7_412", width: 412, height: 915, dpr: 2, mobile: true },
      { name: "iphone_se_375", width: 375, height: 667, dpr: 2, mobile: true },
      { name: "small_phone_320", width: 320, height: 568, dpr: 2, mobile: true },
    ];

    for (const d of devices) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: d.width,
        height: d.height,
        deviceScaleFactor: d.dpr,
        mobile: d.mobile
      });
      await send("Page.navigate", { url: "http://localhost:5173/login" });
      await new Promise(r => setTimeout(r, 800));

      const screenshot = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(`/tmp/device_${d.name}.png`, Buffer.from(screenshot.data, "base64"));
      console.log(`Saved /tmp/device_${d.name}.png`);
    }

    ws.close();
  } catch (err) {
    console.error("Error:", err);
  } finally {
    chrome.kill();
  }
}

run();
