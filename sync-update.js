/**
 * fs.watch的最大缺点就是不支持子文件夹的侦听，并且在很多情况下会侦听到两次事件（很多编辑器在保存的时侯是先把原文件清空，再进行保存，因此会触发两次文件夹改变事件）。因此需要一些开源的模块来监听文件夹目录的改变。
 */

// fs.watch("somedir", function (event, filename) {
//   console.log("event is: " + event);
//   var chokidar = require("chokidar");
// });
// const dns = require("node:dns");

// dns.lookup("github.com", (err, address, family) => {
//   console.log("address: %j family: IPv%s", address, family);
// });

const _path = require("path");
const fse = require("fs-extra");
const fs = require("fs");
const md5 = require("md5");
var chokidar = require("chokidar"); // chokidar  是一个基于node.JS的监听文件夹改变模块。
var log = console.log.bind(console);

const copyDir = function (srcDir, distDir) {
  fse.copy(srcDir, distDir, (err) => {
    if (err) return console.error(err);
    console.log(`copy ${srcDir} success!`);
  });
};

// const copyFile = function (src, dist) {
//   console.log("copy file to" + dist);
//   fse.copy(src, dist, (err) => {
//     if (err) return console.error(err);
//     console.log(`copy ${src} success!`);
//   });
// };
function copyFile(srcPath, tarPath, cb) {
  var rs = fs.createReadStream(srcPath);
  rs.on("error", function (err) {
    if (err) {
      console.log("read error", srcPath);
    }
    cb && cb(err);
  });

  var ws = fs.createWriteStream(tarPath);
  ws.on("error", function (err) {
    if (err) {
      console.log("write error", tarPath);
    }
    cb && cb(err);
  });

  ws.on("close", function (ex) {
    cb && cb(ex);
    // console.log("写入流关闭--");
    rs.close();
  });

  rs.pipe(ws);
  console.log("复制文件完成", srcPath);
}

const srcDir = _path.resolve(__dirname, "./src");
const distDir = _path.resolve(__dirname, "./target");

const getRelativePath = (from, to) => _path.relative(from, to);
const removeFile = (filePath) => fse.remove(filePath);
const removeDir = (dirPath) => fse.remove(dirPath);
const writeFile = function (path, distDir) {
  const relativePath = getRelativePath(srcDir, path);
  const targetPath = _path.join(distDir, relativePath);
  // console.log("path---", path);
  // console.log("relativePath---", relativePath);
  // console.log("targetPath---", targetPath);
  // 检查当前目录中是否存在该文件
  // fse.pathExists(targetPath).then((exists) => {
  //   if (!exists) {
  //     copyFile(path, targetPath);
  //     return;
  //   }
  //   var srcMd5 = md5(fs.readFileSync(path));
  //   var distMd5 = md5(fs.readFileSync(targetPath));
  //   // console.log("srcMd5----", srcMd5);
  //   // console.log("distMd5----", distMd5);
  //   if (srcMd5 == distMd5) {
  //     return;
  //   }
  //   // log("File", path, "has been added");
  //   copyFile(path, targetPath);
  // }); // => false
  fs.access(targetPath, fs.constants.F_OK, (err) => {
    // 没有就直接创建，不校验
    if (err) {
      copyFile(path, targetPath);
      return;
    }
    var srcMd5 = md5(fs.readFileSync(path));
    var distMd5 = md5(fs.readFileSync(targetPath));
    // console.log("srcMd5----", srcMd5);
    // console.log("distMd5----", distMd5);
    if (srcMd5 === distMd5) {
      return;
    }
    // log("File", path, "has been added");
    copyFile(path, targetPath);
  });
};

function syncUpdate(srcDir, distDir) {
  var watcher = chokidar.watch(srcDir, {
    ignored: /[\/\\]\./,
    persistent: true,
  });

  watcher
    .on("add", function (path) {
      writeFile(path, distDir);
    })
    .on("addDir", function (path) {
      log("Directory", path, "has been added");
      const relativePath = getRelativePath(srcDir, path);
      const targetDir = _path.join(distDir, relativePath);
      console.log("---", targetDir);
      fse.ensureDirSync(targetDir, (err) => {
        err && console.log(err); // => null
        // dir has now been created, including the directory it is to be placed in
      });
    })
    .on("change", function (path) {
      log("File", path, "has been changed");
      writeFile(path, distDir);
    })
    .on("unlink", function (path) {
      log("File", path, "has been removed");
      const relativePath = getRelativePath(srcDir, path);
      const targetPath = _path.join(distDir, relativePath);
      log("File", targetPath, "should be remove");
      removeFile(targetPath);
    })
    .on("unlinkDir", function (path) {
      log("Directory", path, "has been removed");
      const relativePath = getRelativePath(srcDir, path);
      const targetDir = _path.join(distDir, relativePath);
      log("Directory", targetDir, "should be remove");
      removeDir(targetDir);
    })
    .on("error", function (error) {
      log("Error happened", error);
    })
    .on("ready", function () {
      log("Initial scan complete. Ready for changes.");
    })
    .on("raw", function (event, path, details) {
      log("Raw event info:", event, path, details);
    });
}

module.exports = syncUpdate;
