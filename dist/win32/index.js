"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pack = exports.init = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
//@ts-ignore
const qode_1 = __importDefault(require("@nodegui/qode"));
//@ts-ignore
const qtConfig_1 = require("@nodegui/nodegui/config/qtConfig");
const patchQode_1 = require("./patchQode");
const cwd = process.cwd();
const deployDirectory = path_1.default.resolve(cwd, "deploy");
const configFile = path_1.default.resolve(deployDirectory, "config.json");
const copyQode = (dest) => __awaiter(void 0, void 0, void 0, function* () {
    const qodeBinaryFile = qode_1.default.qodePath;
    yield fs_extra_1.default.chmod(qodeBinaryFile, "755");
    yield fs_extra_1.default.copyFile(qodeBinaryFile, path_1.default.resolve(dest, "qode.exe"));
});
const copyAppDist = (distPath, resourceDir) => __awaiter(void 0, void 0, void 0, function* () {
    yield fs_extra_1.default.copy(distPath, path_1.default.resolve(resourceDir, "dist"), {
        recursive: true,
    });
});
function getAllNodeAddons(dirPath) {
    const addonExt = "node";
    let dir = fs_extra_1.default.readdirSync(dirPath);
    return dir
        .filter((elm) => elm.match(new RegExp(`.*\.(${addonExt}$)`, "ig")))
        .map((eachElement) => path_1.default.resolve(dirPath, eachElement));
}
const runWinDeployQt = (appName, buildDir) => __awaiter(void 0, void 0, void 0, function* () {
    const winDeployQtBin = path_1.default.resolve(qtConfig_1.qtHome, "bin", "windeployqt.exe");
    // insert qtHome/bin into the PATH for windeployqt work correctly
    process.env.PATH = `${path_1.default.resolve(qtConfig_1.qtHome, "bin")};${process.env.PATH}`;
    const distPath = path_1.default.resolve(buildDir, "dist");
    const allAddons = getAllNodeAddons(distPath);
    const winDeployQt = (0, child_process_1.spawn)(winDeployQtBin, [
        ...allAddons,
        "--verbose=2",
        "--release",
        "--no-translations",
        "--compiler-runtime",
        `--dir=${buildDir}`,
    ], {
        cwd: buildDir,
        env: process.env,
    });
    return new Promise((resolve, reject) => {
        winDeployQt.stdout.on("data", function (data) {
            console.log("stdout: " + data.toString());
        });
        winDeployQt.stderr.on("data", function (data) {
            console.log("stderr: " + data.toString());
        });
        winDeployQt.on("exit", function (code) {
            if (!code) {
                return resolve(true);
            }
            return reject("child process exited with code " + code);
        });
    });
});
const init = (appName) => __awaiter(void 0, void 0, void 0, function* () {
    const config = {
        appName: null,
    };
    const templateDirectory = path_1.default.resolve(__dirname, "../../template/win32");
    const userTemplate = path_1.default.resolve(deployDirectory, "win32");
    const appDir = path_1.default.resolve(userTemplate, appName);
    yield fs_extra_1.default.mkdirp(path_1.default.resolve(userTemplate, appDir));
    yield fs_extra_1.default.copy(templateDirectory, appDir, { recursive: true });
    Object.assign(config, { appName });
    yield fs_extra_1.default.writeJSON(configFile, config);
});
exports.init = init;
const pack = (distPath) => __awaiter(void 0, void 0, void 0, function* () {
    const config = yield fs_extra_1.default.readJSON(path_1.default.resolve(deployDirectory, "config.json"));
    const { appName } = config;
    const usertemplate = path_1.default.resolve(deployDirectory, "win32");
    const templateAppDir = path_1.default.resolve(usertemplate, appName);
    const buildDir = path_1.default.resolve(usertemplate, "build");
    const buildAppPackage = path_1.default.resolve(buildDir, appName);
    console.log(`cleaning build directory at ${buildDir}`);
    yield fs_extra_1.default.remove(buildDir);
    console.log(`creating build directory at ${buildDir}`);
    yield fs_extra_1.default.copy(templateAppDir, buildAppPackage, { recursive: true });
    console.log(`copying qode`);
    yield copyQode(buildAppPackage);
    console.log(`copying dist`);
    yield copyAppDist(distPath, buildAppPackage);
    console.log(`running windeployqt`);
    yield runWinDeployQt(appName, buildAppPackage);
    console.log(`Hiding Qode's console`);
    yield (0, patchQode_1.switchToGuiSubsystem)(path_1.default.resolve(buildAppPackage, "qode.exe"));
    console.log(`Build successful. Find the app at ${buildDir}`);
});
exports.pack = pack;
//# sourceMappingURL=index.js.map