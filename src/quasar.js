const fs = require('fs');
const path = require('path');

const getQuasarClasses = () => {
  const cssFilePath = path.join(__dirname, '..', 'assets', 'quasar.css');
  const css = fs.readFileSync(cssFilePath, 'utf8');
  return extractCssClasses(css);
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

module.exports = {
  getQuasarClasses,
};
