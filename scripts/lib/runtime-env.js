const path = require('path');
const { findWorkingLocalQuarto } = require('./quarto-local');

function withRepoToolPath(baseEnv = process.env) {
  const env = { ...baseEnv };
  const found = findWorkingLocalQuarto();
  if (!found?.path) {
    return {
      env,
      quartoPath: null,
      quartoBinDir: null,
      addedToPath: false
    };
  }

  const quartoBinDir = path.dirname(found.path);
  const pathEntries = String(env.PATH || '').split(path.delimiter).filter(Boolean);
  const alreadyPresent = pathEntries.includes(quartoBinDir);

  if (!alreadyPresent) {
    env.PATH = [quartoBinDir, ...pathEntries].join(path.delimiter);
  }

  return {
    env,
    quartoPath: found.path,
    quartoBinDir,
    addedToPath: !alreadyPresent
  };
}

module.exports = {
  withRepoToolPath
};
