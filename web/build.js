'use strict';

const path = require('path');

// eslint-disable-next-line import/no-extraneous-dependencies
const { exec } = require('mz/child_process');

module.exports = async ({
  addStaticDir,
  outputDir,
  // projectRoot,
}) => {
  await addStaticDir(path.join(__dirname, 'static'), outputDir);

  const browserify = path.join(
    __dirname,
    '..',
    'node_modules',
    '.bin',
    'browserify',
  );

  const indexJs = path.join(
    __dirname,
    '..',
    'src',
    'application.js',
  );

  const dst = path.join(outputDir, 'index.js');

  // Using browserify via exec so that it happens in a separate process
  await exec(`${browserify} ${indexJs} >${dst}`);
};
