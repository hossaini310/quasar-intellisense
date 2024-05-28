const vscode = require('vscode');
const { getQuasarClasses, setStatusBarItem } = require('./quasar');

const languageSupport = ['html', 'vue', 'vue-html'];

const provideCompletionItems = (document, position) => {
  const classRegex = /class(?:Name)?\s*=\s*['"]([^'"]*)$/;

  return new Promise(async (resolve, reject) => {
    try {
      const lineText = document.lineAt(position.line).text;
      const textBeforeCursor = lineText.slice(0, position.character);

      const matches = classRegex.exec(textBeforeCursor);
      if (!matches || !matches[1]) {
        resolve([]);
        return;
      }

      const usedClasses = (matches[1] || '').split(' ').filter((cls) => cls.trim() !== '');
      const availableClasses = (await getQuasarClasses()) || [];

      const completionItems = availableClasses
        .filter(({ className }) => !usedClasses.includes(className))
        .map(({ className, classContent }) => {
          const item = new vscode.CompletionItem(className, vscode.CompletionItemKind.Value);
          item.detail = 'Quasar IntelliSense';
          item.documentation = new vscode.MarkdownString().appendCodeblock(classContent, 'css');
          item.insertText = className;
          return item;
        });

      resolve(completionItems);
    } catch (error) {
      console.error('Error in provideCompletionItems:', error.message, error.stack);
      reject([]);
    }
  });
};

const activate = (context) => {
  setStatusBarItem();

  const disposable = vscode.languages.registerCompletionItemProvider(
    languageSupport,
    {
      provideCompletionItems,
    },
    ' ',
    '"',
    "'",
  );

  context.subscriptions.push(disposable);
};

module.exports = { activate };
