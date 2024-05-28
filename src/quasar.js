const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const axios = require('axios');

let statusBarItem = null;
let cachedClasses = null;
let cachedFileMtime = null;

const getQuasarCdnLink = async () => {
  try {
    const htmlFiles = await vscode.workspace.findFiles('**/*.html');
    const cdnRegex =
      /<link[^>]+href=["'](https:\/\/cdn\.jsdelivr\.net\/npm\/quasar@\d+\.\d+\.\d+\/dist\/quasar(?:\.[^\/]+)?\.css)["']/;

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file.fsPath, 'utf8');
      const match = cdnRegex.exec(content);
      if (match) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    vscode.window.showWarningMessage(`Error finding Quasar CDN link: ${error}`);
    return null;
  }
};

const getQuasarVersion = (cdnLink) => {
  const versionRegex = /@(\d+\.\d+\.\d+)/;
  const matches = cdnLink.match(versionRegex);
  if (matches && matches[1]) {
    return matches[1];
  }
};

const setStatusBarItem = async () => {
  try {
    const packageJsonPath = await vscode.workspace.findFiles('**/node_modules/quasar/package.json');
    let quasarVersion;

    if (packageJsonPath[0]) {
      const packageJson = JSON.parse(fs.readFileSync(path.join(packageJsonPath[0].fsPath), 'utf8'));
      quasarVersion = packageJson.version;
    } else {
      quasarVersion = getQuasarVersion(await getQuasarCdnLink());
    }

    if (!statusBarItem) {
      statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    }

    if (quasarVersion) {
      statusBarItem.text = `$(quasar-icon) Quasar v${quasarVersion
        .split('.')
        .slice(0, 2)
        .join('.')}`;
      statusBarItem.tooltip = 'Your current Quasar css version in this project';
      statusBarItem.show();
    }
  } catch (error) {
    return null;
  }
};

const extractCssClasses = (css) => {
  try {
    const classRegex = /(?:^|\s)\.([\w-]+)\s*{([^}]*)}/gs;
    const classes = [];
    let match;

    while ((match = classRegex.exec(css))) {
      const className = match[1];
      let classContent = match[2].trim();

      classContent = '{\n  ' + classContent;
      classContent = classContent.replace(/;\s*/g, ';\n  ');
      classContent = classContent.replace(/\s*$/, '\n}');

      classes.push({
        className,
        classContent: `.${className} ${classContent}`,
      });
    }

    return classes;
  } catch (error) {
    vscode.window.showWarningMessage(`Error extracting CSS classes: ${error}`);
    return [];
  }
};

const getCssFromCdn = async (url) => {
  try {
    const quasarVersion = getQuasarVersion(url);
    const response = await axios.get(
      `https://cdn.jsdelivr.net/npm/quasar@${quasarVersion}/dist/quasar.css`,
    );

    return response.data;
  } catch (error) {
    vscode.window.showWarningMessage(`Error fetching Quasar CSS from CDN: ${error}`);
    return null;
  }
};

const getQuasarClasses = async () => {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null; // No workspace is open
    }

    const quasarFiles = await vscode.workspace.findFiles('**/node_modules/quasar/dist/quasar.css');

    if (quasarFiles.length > 0) {
      const quasarPath = quasarFiles[0].fsPath;

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
          vscode.window.showInformationMessage(`Quasar file not found: ${quasarPath}`);
          return null;
        }
      } catch (error) {
        vscode.window.showInformationMessage(`Error reading Quasar file: ${error}`);
        return null;
      }
    } else {
      const cdnLink = await getQuasarCdnLink();
      if (cdnLink) {
        const css = await getCssFromCdn(cdnLink);
        if (css) {
          cachedClasses = extractCssClasses(css);
          return cachedClasses;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

module.exports = {
  getQuasarClasses,
  setStatusBarItem,
};
