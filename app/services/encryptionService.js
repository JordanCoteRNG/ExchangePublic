const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

const encrypt = (password, salt, dataToEncrypt) => {
    const iv = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(dataToEncrypt);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}
const decrypt = (password, salt, encrypted, ivData) => {
   let ivBuffer = Buffer.from(ivData, 'hex');
   let encryptedText = Buffer.from(encrypted, 'hex');
   const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
   let decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
   let decrypted = decipher.update(encryptedText);
   decrypted = Buffer.concat([decrypted, decipher.final()]);
   return decrypted.toString();
}

module.exports = {
    encrypt,
    decrypt,
};