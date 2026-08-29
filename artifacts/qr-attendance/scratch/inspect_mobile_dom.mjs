import { spawn } from "child_process";
import http from "http";

async function main() {
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--window-size=390,844",
    "http://localhost:5173/login"
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch("http://localhost:9222/json");
    const pages = await listRes.json();
    const page = pages[0];
    const wsUrl = page.webSocketDebuggerUrl;

    const WebSocket = (await import("ws")).default;
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve) => ws.on("open", resolve));

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.id === msgId) {
            ws.off("message", handler);
            resolve(msg.result);
          }
        };
        ws.on("message", handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send("Page.enable");
    await send("DOM.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { angle: 0, type: "portraitPrimary" }
    });

    await new Promise(r => setTimeout(r, 500));

    const evalResult = await send("Runtime.evaluate", {
      expression: `(() => {
        const els = document.querySelectorAll('*');
        const results = [];
        for (const el of els) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 390 || rect.right > 390 || rect.left < 0) {
            results.push({
              tag: el.tagName,
              cls: el.className,
              rect: { left: rect.left, right: rect.right, width: rect.width }
            });
          }
        }
        return JSON.stringify({
          windowWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          overflowing: results
        }, null, 2);
      })()`
    });

    console.log(evalResult.result.value);

    // Also take screenshot
    const screenshot = await send("Page.captureScreenshot", { format: "png" });
    const fs = await import("fs");
    fs.writeFileSync("/tmp/cdp_mobile_390.png", Buffer.from(screenshot.data, "base64"));
    console.log("Saved screenshot to /tmp/cdp_mobile_390.png");

    ws.close();
  } catch (err) {
    console.error("Error:", err);
  } finally {
    chrome.kill();
  }
}

main();
