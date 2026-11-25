const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

const config = {
  mode: 'production',
  entry: './lib/standalone.js',
  output: {
    path: path.resolve(__dirname, '../dist-web'),
    filename: 'bundle.js',
    publicPath: './'
  },
  resolve: {
    extensions: ['.js', '.json']
  }
};

console.log('[build-web] Bundling standalone web portal...');
webpack(config, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err || stats.toString({ colors: true }));
    process.exit(1);
  }
  const htmlSrc = path.resolve(__dirname, '../public/index.html');
  const htmlDist = path.resolve(__dirname, '../dist-web/index.html');
  let html = fs.readFileSync(htmlSrc, 'utf8');
  html = html.replace('</body>', '<script src="./bundle.js"></script></body>');
  fs.writeFileSync(htmlDist, html, 'utf8');
  console.log('[build-web] SUCCESS: dist-web/ generated with bundle.js and index.html!');
});
