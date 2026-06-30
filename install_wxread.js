const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

const baseDir = "/app/Dumb-Panel/scripts/wxread_tool";
const zipPath = path.join(baseDir, "wxread.zip");
const launcherPath = "/app/Dumb-Panel/scripts/wxread_run.js";
const url = "https://github.com/findmover/wxread/archive/refs/heads/main.zip";

function download(fileUrl, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https.get(fileUrl, { headers: { "User-Agent": "Dumb-Panel" } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        return reject(new Error(`下载失败，HTTP ${res.statusCode}`));
      }

      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) walk(full, results);
    else results.push(full);
  }

  return results;
}

(async () => {
  try {
    console.log("开始安装 wxread...");
    fs.mkdirSync(baseDir, { recursive: true });

    console.log("正在下载:", url);
    await download(url, zipPath);

    console.log("正在解压...");
    execSync(`python3 -m zipfile -e "${zipPath}" "${baseDir}"`, { stdio: "inherit" });

    console.log("正在查找 main.py...");
    const files = walk(baseDir);
    const mainFile = files.find(f => path.basename(f) === "main.py" && f.includes("wxread-main"));

    if (!mainFile) {
      throw new Error("没有找到 wxread-main/main.py，请检查下载或解压是否成功");
    }

    const projectDir = path.dirname(mainFile);
    console.log("找到项目目录:", projectDir);

    console.log("安装 Python 依赖 requests / urllib3...");
    try {
      execSync("python3 -m pip install --user requests urllib3", { stdio: "inherit" });
    } catch (e) {
      console.log("pip 安装失败或环境已自带依赖，继续生成启动器。后续如果缺 requests 再单独安装。");
    }

    const launcherCode = `
const { execSync } = require("child_process");

const projectDir = ${JSON.stringify(projectDir)};
const cmd = 'cd "' + projectDir + '" && python3 main.py';

console.log("执行命令:", cmd);

execSync(cmd, {
  stdio: "inherit",
  env: {
    ...process.env,
    TZ: "Asia/Shanghai"
  }
});
`;

    fs.writeFileSync(launcherPath, launcherCode.trim() + "\n", "utf8");

    console.log("安装完成！");
    console.log("已生成启动器:", launcherPath);
    console.log("运行命令：node wxread_run.js");
  } catch (err) {
    console.error("安装失败：", err.message);
    process.exit(1);
  }
})();
