// Node-RED-Zugangsdaten (flows_<id>_cred.json) vom alten auf den neuen ENCRIPTION_KEY umschluesseln.
//
// Aufruf (im node-red-Container):
//   node migrate-node-red-credentials.js <pfad-zur-cred-datei> <alter-schluessel>
// Der neue Schluessel kommt aus der Umgebungsvariable ENCRIPTION_KEY.
//
// Gibt nur Statuszeilen aus, nie Zugangsdaten. Legt <datei>.pre-migration als Sicherung an.
// Node-RED: AES-256-CTR, Schluessel = SHA-256 des Secrets, Wert "$" = IV (hex, 32 Zeichen) + Base64-Daten.
const fs = require('fs');
const crypto = require('crypto');

const file = process.argv[2];
const oldKey = process.argv[3];
const newKey = process.env.ENCRIPTION_KEY;
if (!file || !oldKey || !newKey) {
  console.log('RESULT usage: node migrate-node-red-credentials.js <datei> <alter-schluessel> (ENCRIPTION_KEY gesetzt)');
  process.exit(1);
}

const key = (secret) => crypto.createHash('sha256').update(secret).digest();

const decrypt = (cred, secret) => {
  const iv = Buffer.from(cred.$.substring(0, 32), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-ctr', key(secret), iv);
  return decipher.update(cred.$.substring(32), 'base64', 'utf8') + decipher.final('utf8');
};

const encrypt = (obj, secret) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-ctr', key(secret), iv);
  return { $: iv.toString('hex') + cipher.update(JSON.stringify(obj), 'utf8', 'base64') + cipher.final('base64') };
};

const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!parsed.$) {
  console.log('RESULT nothing-encrypted');
  process.exit(0);
}

try {
  JSON.parse(decrypt(parsed, newKey));
  console.log('RESULT already-new-key');
  process.exit(0);
} catch (e) { /* mit dem neuen Schluessel nicht lesbar, wie erwartet */ }

let plain;
try {
  plain = JSON.parse(decrypt(parsed, oldKey));
} catch (e) {
  console.log('RESULT cannot-decrypt-with-old-key');
  process.exit(2);
}

fs.copyFileSync(file, file + '.pre-migration');
fs.writeFileSync(file + '.tmp', JSON.stringify(encrypt(plain, newKey), null, 4));
const check = JSON.parse(decrypt(JSON.parse(fs.readFileSync(file + '.tmp', 'utf8')), newKey));
if (JSON.stringify(check) !== JSON.stringify(plain)) {
  fs.unlinkSync(file + '.tmp');
  console.log('RESULT verify-failed');
  process.exit(3);
}
fs.renameSync(file + '.tmp', file);
const withCreds = Object.keys(plain).filter((id) => Object.keys(plain[id]).length).length;
console.log('RESULT migrated; nodes with credentials:', withCreds);
