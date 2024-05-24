const path = require('path');
const fs = require('fs');
const vscode = require('vscode');

let statusBarItem = null;
let cachedClasses = null;
let cachedFileMtime = null;

const setStatusBarItem = async () => {
  const packageJsonPath = await vscode.workspace.findFiles('**/node_modules/quasar/package.json');
  const packageJson = await JSON.parse(
    fs.readFileSync(path.join(packageJsonPath[0].fsPath), 'utf8'),
  );

  if (statusBarItem === null) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
  }

  statusBarItem.text = `$(quasar-icon) Quasar v${packageJson.version
    .split('.')
    .slice(0, 2)
    .join('.')}`;
  statusBarItem.tooltip = 'Your current Quasar css version in this project';

  statusBarItem.show();
};

const extractCssClasses = (css) => {
  const classRegex = /\.(?!\d)([\w-]+)/g;
  const classes = new Set();
  let match;
  while ((match = classRegex.exec(css))) {
    classes.add(match[1]);
  }
  return Array.from(classes);
};

const getQuasarClasses = async () => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return null; // No workspace is open
  }

  const quasar = await vscode.workspace.findFiles('**/node_modules/quasar/dist/quasar.css');
  const quasarPath = quasar[0].fsPath;

  try {
    if (fs.existsSync(quasarPath)) {
      const stats = fs.statSync(quasarPath);
      const mtime = stats.mtime.getTime();

      // If the file has not changed, return the cached value
      if (cachedFileMtime === mtime) {
        return cachedClasses;
      }

      // File has changed or is being loaded for the first time
      const css = fs.readFileSync(quasarPath, 'utf8');
      cachedClasses = extractCssClasses(css);
      cachedFileMtime = mtime;

      return cachedClasses;
    } else {
      vscode.window.showInformationMessage(`Quasar CSS file not found: ${quasarPath}`);
      return null;
    }
  } catch (error) {
    vscode.window.showInformationMessage(`Error reading Quasar CSS file: ${error}`);
    return null;
  }
};

module.exports = {
  getQuasarClasses,
  setStatusBarItem,
};
