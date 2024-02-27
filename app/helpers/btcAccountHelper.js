const cryptoConvert = require("crypto-convert").default;
const convert = new cryptoConvert();
const mnemonic = require("bitcore-mnemonic");
const bitcore = require("bitcore-lib");
const axios = require("axios");
const encryptionService = require("../services/encryptionService");
const transactionLogger = require("./transactionLogger");

const apiNetwork = "https://api.blockcypher.com/v1/btc/test3"
const blockCypherToken = ""; // Need token

let publicAddress;
let privateAddress;

const generateWallet = async (newUser, password) => {
   const seedPhrase = new mnemonic();

    //Obtenir la clé private domain depuis le hash de la phrase mnénonique
    const seedHash = bitcore.crypto.Hash.sha256(new Buffer(seedPhrase.toString()));
    const bn = bitcore.crypto.BN.fromBuffer(seedHash);
    const pk = new bitcore.PrivateKey(bn, bitcore.Networks.testnet);

    //obtenir la clé publique a partir de la clé privé
    const walletAddress = pk.toAddress();

    const encrypted = encryptionService.encrypt(password, newUser.salt, pk.toString());
    newUser.btcPrivateKey = encrypted.encryptedData;
    newUser.btcIv = encrypted.iv;
    newUser.btcPublicKey = walletAddress;
    await newUser.save();
}

async function getBalance(address) {

 const url = `${apiNetwork}/addrs/${address}/balance`;
 const result = await axios.get(url).then();
 const data = result.data;
 const balance = parseFloat(data.final_balance / 100000000); // Values are in SAT (100 000 000 sats = 1 BTC)
 return balance.toFixed(8);
}

async function transferBitcoin(req, res) {
 let btcAmount = req.body.amount;
 let address = req.body.address;
 publicAddress = req.session.user.btcPublicKey;
 privateAddress = encryptionService.decrypt(req.session.password, req.session.user.salt, req.session.user.btcPrivateKey, req.session.user.btcIv);

 if (btcAmount === undefined || btcAmount === "") {
  req.flash('error', "La quantité doit être donnée");
  res.redirect("/transfer");
  return;
 }

 if (isNaN(btcAmount)) {
  req.flash('error', "La quantité doit être un chiffre");
  res.redirect("/transfer");
  return;
 }

 if (parseFloat(btcAmount) < 0) {
  req.flash('error', "Le montant ne peut pas être inférieur à 0.");
  res.redirect("/sell");
  return;
 }

 if (address === undefined || address === "") {
  req.flash('error', "L'addresse de destination doit être donnée");
  res.redirect("/transfer");
  return;
 }

 if (!bitcore.Address.isValid(address, bitcore.Networks.testnet)) {
  req.flash('error', "Addresse du récipient invalide. Assurez-vous d'utiliser une addresse valide sur le testnet.");
  res.redirect("/transfer");
  return;
 }

 try {
  const result = await sendBitcoin(address, btcAmount);
  req.flash('success', btcAmount + " BTC envoyé avec succès à " + address
      + ". La transaction peut prendre plusieurs minutes avant d'être confirmé.");
  await transactionLogger.addTransaction(req, "Transfert", "BTC", publicAddress, address, btcAmount);
  delete req.session.mfaCheck;
  res.redirect("/home");
 } catch (e) {
  let errorMessage = e.message;
  if (e.response && e.response.data && e.response.data.error) {
   errorMessage = errorMessage + " (" + e.response.data.error + ")";
  }
  req.flash("error", errorMessage);
  res.redirect("/transfer");
 }
}

async function buyBitcoin(req, res, user) {
 let amount = req.body.amount;
 let address = req.session.user.btcPublicKey;
 publicAddress = global.btcBankPublicKey;
 privateAddress = global.btcBankPrivateKey;

 if (amount === undefined || amount === "") {
  req.flash('error', "The amount to sent must be given.");
  res.redirect("/buyCrypto");
  return;
 }

 if (isNaN(amount)) {
  req.flash('error', "The amount must be numeric.");
  res.redirect("/buyCrypto");
  return;
 }

 if (parseFloat(amount) < 0) {
  req.flash('error', "Le montant ne peut pas être inférieur à 0.");
  res.redirect("/sell");
  return;
 }

 if (parseFloat(amount) > req.session.user.fiats) {
  req.flash('error', "Vous n'avez pas assez de fond!");
  res.redirect("/buyCrypto");
  return;
 }

 const btcAmount = await fiatsConverter(parseFloat(amount), false);
 if (btcAmount === undefined || btcAmount === 0) {
  req.flash('error', "Le système de transaction n'est pas fonctionnel. Réesayer plus tard.");
  res.redirect("/buyCrypto");
  return;
 }

 if (address === undefined || address === "") {
  req.flash('error', "Le système de transaction n'est pas fonctionnel. Réesayer plus tard.");
  res.redirect("/buyCrypto");
  return;
 }

 if (!bitcore.Address.isValid(address, bitcore.Networks.testnet)) {
  req.flash('error', "Erreur avec les adresses, veuillez réesayer plus tard.");
  res.redirect("/buyCrypto");
  return;
 }

 try {
  const result = await sendBitcoin(address, btcAmount);
  req.flash('success', btcAmount + " BTC " + "(" + amount + " $CAD)" + " envoyé avec succès à votre compte bitcoin. La transaction pourrait prendre plusieurs minutes avant d'être compléter.");
  user.fiats = (parseFloat(user.fiats) - parseFloat(amount)).toFixed(2);
  user.save();
  req.session.user.fiats = user.fiats;
  await transactionLogger.addTransaction(req, "Achat", "BTC", publicAddress, address, btcAmount);
  await transactionLogger.addTransaction(req, "Transfert", "Fiats", "Votre compte", "Cryptova", amount);
  delete req.session.mfaCheck;
  res.redirect("/home");
 } catch (e) {
  let errorMessage = e.message;
  if (e.response && e.response.data && e.response.data.error) {
   errorMessage = errorMessage + " (" + e.response.data.error + ")";
  }
  req.flash("error", errorMessage);
  res.redirect("/buyCrypto");
 }
}

async function sellBitcoin(req, res, user) {
 let btcAmount = req.body.amount;
 let address = global.btcBankPublicKey;
 publicAddress = req.session.user.btcPublicKey;
 privateAddress = encryptionService.decrypt(req.session.password, req.session.user.salt, req.session.user.btcPrivateKey, req.session.user.btcIv);

 if (btcAmount === undefined || btcAmount === "") {
  req.flash('error', "La quantité doit être donnée");
  res.redirect("/sell");
  return;
 }

 if (isNaN(btcAmount)) {
  req.flash('error', "La quantité doit être un chiffre");
  res.redirect("/sell");
  return;
 }
 if (parseFloat(btcAmount) < 0) {
  req.flash('error', "Le montant ne peut pas être inférieur à 0.");
  res.redirect("/sell");
  return;
 }

 if (address === undefined || address === "") {
  req.flash('error', "L'addresse de destination doit être donnée");
  res.redirect("/sell");
  return;
 }

 if (!bitcore.Address.isValid(address, bitcore.Networks.testnet)) {
  req.flash('error', "Addresse du récipient invalide. Assurez-vous d'utiliser une addresse valide sur le testnet.");
  res.redirect("/sell");
  return;
 }

 try {
  const result = await sendBitcoin(address, btcAmount);
  let cadAmount = await fiatsConverter(parseFloat(btcAmount), true);
  req.flash('success', btcAmount + " BTC envoyé avec succès à " + "Cryptova. Vous avez été payé " + cadAmount.toFixed(2) + " $CAD."
      + ". La transaction peut prendre plusieurs minutes avant d'être confirmé.");
  user.fiats = (parseFloat(user.fiats) + cadAmount).toFixed(2);
  user.save();
  req.session.user.fiats = (parseFloat(req.session.user.fiats) + cadAmount).toFixed(2);
  await transactionLogger.addTransaction(req, "Vente", "BTC", publicAddress, address, btcAmount);
  await transactionLogger.addTransaction(req, "Transfert", "Fiats", "Cryptova", "Votre compte", cadAmount.toFixed(2));
  delete req.session.mfaCheck;
  res.redirect("/home");
 } catch (e) {
  let errorMessage = e.message;
  if (e.response && e.response.data && e.response.data.error) {
   errorMessage = errorMessage + " (" + e.response.data.error + ")";
  }
  req.flash("error", errorMessage);
  res.redirect("/sell");
 }
}

async function sendBitcoin(toAddress, btcAmount) {

 const satoshiToSend = Math.ceil(btcAmount * 100000000);
 const txUrl = `${apiNetwork}/addrs/${publicAddress}?includeScript=true&unspentOnly=true`;
 const txResult = await axios.get(txUrl);

 let inputs = [];
 let totalAmountAvailable = 0;
 let inputCount = 0;

 let outputs = txResult.data.txrefs || [];
 outputs = outputs.concat(txResult.data.unconfirmed_txrefs  || []);

 for(const  element of outputs) {
  let utx = {};
  utx.satoshis = Number(element.value);
  utx.script = element.script;
  utx.address = txResult.data.address;
  utx.txId = element.tx_hash;
  utx.outputIndex = element.tx_output_n;
  totalAmountAvailable += utx.satoshis;
  inputCount += 1;
  inputs.push(utx);
 }

 const transaction = new bitcore.Transaction();
 transaction.from(inputs);
 let outputCount = 2;
 let transactionSize = inputCount * 148 + outputCount * 34 + 10;
 let fee = transactionSize * 20;

 if (totalAmountAvailable - satoshiToSend - fee < 0) {
  throw new Error("Pas assez de BTC pour couvrir la transaction.");
 }

 transaction.to(toAddress, satoshiToSend);
 transaction.fee(fee);
 transaction.change(publicAddress);
 transaction.sign(privateAddress);

 const serializeTransaction = transaction.serialize();

 const result = await axios({
  method: "POST",
  url: `${apiNetwork}/txs/push?token=${blockCypherToken}`,
  data: {
   tx: serializeTransaction
  }
 });
 return result.data;
}

async function fiatsConverter(amount, amountIsCrypto) {

 await convert.ready();

 if (amountIsCrypto) {
  return convert.BTC.CAD(amount);
 }
 return convert.CAD.BTC(amount);
}

module.exports = {
 generateWallet,
 getBalance,
 transferBitcoin,
 buyBitcoin,
 sellBitcoin,
 fiatsConverter,
};