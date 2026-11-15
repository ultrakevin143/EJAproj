const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hashPassword } = require('../lib/passwords');

const accounts = [
  ['Front desk account', 'FITQUALITY_PASSWORD_HASH_USR_FRONTDESK_02'],
  ['Clinic account', 'FITQUALITY_PASSWORD_HASH_USR_CLINIC_02'],
  ['Turnstile account', 'FITQUALITY_PASSWORD_HASH_USR_TURNSTILE_02'],
  ['Data steward account', 'FITQUALITY_PASSWORD_HASH_USR_STEWARD_02'],
  ['Manager account', 'FITQUALITY_PASSWORD_HASH_USR_MANAGER_02'],
  ['Administrator account', 'FITQUALITY_PASSWORD_HASH_USR_ADMIN_02']
];

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Run this setup from a VS Code terminal so passwords can be entered privately.'));
  }

  return new Promise((resolve, reject) => {
    let value = '';
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const finish = (error) => {
      process.stdin.setRawMode(false);
      process.stdin.removeListener('data', onData);
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (buffer) => {
      for (const character of buffer.toString('utf8')) {
        if (character === '\u0003') return finish(new Error('Password setup cancelled.'));
        if (character === '\r' || character === '\n') return finish();
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
        } else if (character >= ' ') {
          value += character;
        }
      }
    };

    process.stdin.on('data', onData);
  });
}

function updateEnvValue(content, key, value) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const linePattern = new RegExp(`^${escapedKey}=.*$`, 'm');
  if (linePattern.test(content)) return content.replace(linePattern, `${key}=${value}`);
  return `${content.trimEnd()}\n${key}=${value}\n`;
}

async function promptHash(label, usedPasswordFingerprints) {
  for (;;) {
    const password = await readHidden(`${label} password (at least 12 characters): `);
    const passwordHash = hashPassword(password);
    if (!passwordHash) {
      process.stdout.write('Use at least 12 characters and try again.\n');
      continue;
    }

    const fingerprint = crypto.createHash('sha256').update(password).digest('hex');
    if (usedPasswordFingerprints.has(fingerprint)) {
      process.stdout.write('Each account needs a different password. Please choose another.\n');
      continue;
    }

    const confirmation = await readHidden('Confirm password: ');
    if (password !== confirmation) {
      process.stdout.write('The passwords did not match. Please try this account again.\n');
      continue;
    }

    return { passwordHash, fingerprint };
  }
}

async function main() {
  const backendDirectory = path.join(__dirname, '..');
  const envPath = path.join(backendDirectory, '.env.local');
  const examplePath = path.join(backendDirectory, '.env.local.example');
  let envContent = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf8')
    : fs.readFileSync(examplePath, 'utf8');

  const usedPasswordFingerprints = new Set();
  for (const [label, envKey] of accounts) {
    const { passwordHash, fingerprint } = await promptHash(label, usedPasswordFingerprints);
    usedPasswordFingerprints.add(fingerprint);
    envContent = updateEnvValue(envContent, envKey, passwordHash);
    process.stdout.write(`${label} password hash prepared locally.\n`);
  }

  fs.writeFileSync(envPath, envContent, { encoding: 'utf8', mode: 0o600 });
  process.stdout.write('All six password hashes were saved in backend/.env.local. Passwords were not saved or displayed.\n');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
