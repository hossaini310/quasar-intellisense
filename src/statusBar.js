const fs = require('fs');
const vscode = require('vscode');
const path = require('path');

const getQuasarVersionFromIndexHtml = async () => {
  try {
    const htmlFiles = await vscode.workspace.findFiles('**/*.html');
    const quasarLinkRegex = /<link[^>]+href=["']((?!cdn)[^"']*quasar[^"']*\.css)["']/g;
    const quasarVersionRegex = /\d+\.\d+\.\d+/;

    for (const file of htmlFiles) {
      const fileContent = await fs.promises.readFile(file.fsPath, 'utf8');
      const quasarLinkMatches = [...fileContent.matchAll(quasarLinkRegex)];

      for (const match of quasarLinkMatches) {
        const versionMatch = match[1].match(quasarVersionRegex);

        if (versionMatch) {
          return versionMatch[0];
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
};

const getQuasarVersionFromLocalCssFile = async () => {
  try {
    const packageJsonPath = await vscode.workspace.findFiles('**/node_modules/quasar/package.json');
    const packageJson = JSON.parse(fs.readFileSync(path.join(packageJsonPath[0].fsPath), 'utf8'));
    return packageJson.version;
  } catch (error) {
    return null;
  }
};

const setStatusBarItem = async () => {
  try {
    let version = await getQuasarVersionFromIndexHtml();

    if (!version) {
      version = await getQuasarVersionFromLocalCssFile();
    }

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    statusBarItem.text = version ? `$(quasar-icon) Quasar v${version}` : '';
    statusBarItem.tooltip = 'Your current Quasar version in this project';
    statusBarItem.show();
  } catch (error) {
    vscode.window.showWarningMessage(`Error setting status bar item: ${error}`);
  }
};

module.exports = {
  setStatusBarItem,
};
