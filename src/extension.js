const vscode = require('vscode');
const { getQuasarClasses } = require('./quasar');

const languageSupport = ['vue', 'vue-html'];

function activate(context) {
  const disposable = vscode.languages.registerCompletionItemProvider(
    languageSupport,
    {
      async provideCompletionItems(document, position) {
        const lineText = document.lineAt(position).text;
        if (
          lineText.lastIndexOf('class=', position.character) === -1 &&
          lineText.lastIndexOf('className=', position.character) === -1
        ) {
          return undefined;
        }
        const classes = getQuasarClasses();
        const completionItems = [];
        for (const className of classes) {
          const completionItem = new vscode.CompletionItem();
          completionItem.label = `${className} `;

          completionItem.kind = vscode.CompletionItemKind.Class;
          completionItem.detail = 'Quasar IntelliSense';

          completionItems.push(completionItem);
        }
        return completionItems;
      },
    },
    ' ',
    '"',
    "'",
  );
  context.subscriptions.push(disposable);
}

function deactivate() {
  clearCache();
}

module.exports = {
  activate,
  deactivate,
};
