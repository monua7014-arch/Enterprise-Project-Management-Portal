const path = require('path');
const fs = require('fs');

module.exports = {
  mode: 'production',
  entry: './lib/standalone.js',
  output: {
    path: path.resolve(__dirname, 'dist-web'),
    filename: 'bundle.js',
    publicPath: './'
  },
  resolve: {
    extensions: ['.js', '.json']
  },
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('CopyHtmlPlugin', (compilation) => {
          const htmlSrc = path.resolve(__dirname, 'public/index.html');
          const htmlDist = path.resolve(__dirname, 'dist-web/index.html');
          let html = fs.readFileSync(htmlSrc, 'utf8');
          html = html.replace('</body>', '<script src="./bundle.js"></script></body>');
          fs.writeFileSync(htmlDist, html, 'utf8');
          console.log('[Standalone] dist-web/index.html created successfully.');
        });
      }
    }
  ]
};
