const fs = require('fs');
const vscode = require('vscode');
const axios = require('axios');

const extractCssClasses = (css) => {
  try {
    const classRegex = /\.([a-zA-Z0-9\-_]+)([^{]*?)\s*{([^}]*)}/gs;
    const classes = [];
    let match;

    while ((match = classRegex.exec(css))) {
      const className = match[1];
      let classProperties = match[0];

      classProperties = classProperties
        .replace(/\s*{\s*/, ' {\n  ')
        .replace(/;\s*/g, ';\n  ')
        .replace(/\s*}\s*$/, '\n}');

      classes.push({
        className: className,
        classProperties: classProperties,
      });
    }

    return classes;
  } catch (error) {
    console.error(`Error extracting CSS classes: ${error}`);
    return [];
  }
};

const getQuasarCdnLink = async () => {
  try {
    const htmlFiles = await vscode.workspace.findFiles('**/*.html');
    const cdnRegex = /<link[^>]+href=["']((?!cdn)[^"']*quasar[^"']*\.css)["']/;

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file.fsPath, 'utf8');
      const match = content.match(cdnRegex);
      if (match) return match[1];
    }

    return null;
  } catch (error) {
    vscode.window.showWarningMessage(`Error finding Quasar CDN link: ${error}`);
    return null;
  }
};

const getCssFromCdn = async (url) => {
  try {
    let quasarVersion = null;
    const versionRegex = /@(\d+\.\d+\.\d+)/;
    const matches = url.match(versionRegex);
    if (matches && matches[1]) {
      quasarVersion = matches[1];
    }

    const response = await axios.get(
      `https://cdn.jsdelivr.net/npm/quasar@${quasarVersion}/dist/quasar.css`,
    );

    return response.data;
  } catch (error) {
    vscode.window.showWarningMessage(`Error fetching Quasar CSS from CDN: ${error}`);
    return null;
  }
};

const getCssFromLocalFiles = async () => {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null; // No workspace is open
    }

    let searchPatterns = ['**/node_modules/quasar/dist/quasar.css'];

    for (const pattern of searchPatterns) {
      const quasarFiles = await vscode.workspace.findFiles(pattern);
      for (const file of quasarFiles) {
        const quasarPath = file.fsPath;
        if (fs.existsSync(quasarPath)) {
          const css = await fs.promises.readFile(quasarPath, 'utf8');
          return css;
        } else {
          vscode.window.showInformationMessage(`Quasar file not found: ${quasarPath}`);
        }
      }
    }
    return null;
  } catch (error) {
    vscode.window.showInformationMessage(`Error finding Quasar file in local files: ${error}`);
    return null;
  }
};

const getClasses = async () => {
  try {
    let css = await getCssFromLocalFiles();

    if (!css) {
      const cdnLink = await getQuasarCdnLink();
      if (cdnLink) {
        css = await getCssFromCdn(cdnLink);
      }
    }

    if (css) return extractCssClasses(css);

    return null;
  } catch (error) {
    vscode.window.showInformationMessage(`Error finding Quasar classes: ${error}`);
    return null;
  }
};

module.exports = {
  getClasses,
};
