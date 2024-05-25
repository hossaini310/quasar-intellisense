const vscode = require('vscode');
const { Position, Range } = vscode;
const { getQuasarClasses, setStatusBarItem } = require('./quasar');

const languageSupport = ['vue', 'vue-html'];

const activate = async (context) => {
  setStatusBarItem();

  const quasarPath = await vscode.workspace.findFiles('**/node_modules/quasar/package.json');

  if (!quasarPath[0]) {
    return null;
  }

  vscode.window.showInformationMessage(
    '🎉Champion mode unlocked: Now, Quasar classes will be automatically suggested as you code! ',
  );

  const classRegex = /class(?:Name)?=["']([ -\w]*)(?!["'])$/;

  const disposable = vscode.languages.registerCompletionItemProvider(
    languageSupport,
    {
      async provideCompletionItems(document, position) {
        const lineUntilPos = document.getText(new Range(new Position(position.line, 0), position));
        const matches = lineUntilPos.match(classRegex);
        if (!matches) {
          return null;
        }

        const classes = await getQuasarClasses();
        const completionItems = [];

        matches[1].split(' ').forEach((className) => {
          const index = classes.indexOf(className);
          if (index !== -1) {
            classes.splice(index, 1);
          }
        });

        for (const className of classes) {
          const completionItem = new vscode.CompletionItem(className);

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
};

module.exports = {
  activate,
};
