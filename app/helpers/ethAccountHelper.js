const cryptoConvert = require("crypto-convert").default;
const convert = new cryptoConvert();
const Web3 = require("web3");
const network = "https://sepolia.infura.io/v3/"; // Need Key
const web3 = new Web3(new Web3.providers.HttpProvider(network));
const web3Account = require("web3-eth-accounts");
const encryptionService = require('../services/encryptionService');
const transactionLogger = require("./transactionLogger");

let publicAddress;
let privateKey;

const generateWallet = async (newUser, password) => {
    const EthWallet = web3Account.create();
    const encrypted = encryptionService.encrypt(password, newUser.salt, EthWallet.privateKey);
    newUser.ethPrivateKey = encrypted.encryptedData;
    newUser.ethIv = encrypted.iv;
    newUser.ethPublicKey = EthWallet.address;
    newUser.save();
}

async function getBalance(address) {
    return new Promise((resolve, reject) => {
        web3.eth.getBalance(address, (err, result) => {
            if (err) {
                return reject(err);
            }
            const eth = web3.utils.fromWei(result, "ether");
            resolve(parseFloat(eth).toFixed(5));
        });
    });
}

async function transferETH(req, res) {
    let ethAmount = req.body.amount;
    let address = req.body.address;
    publicAddress = req.session.user.ethPublicKey;
    privateKey = encryptionService.decrypt(req.session.password, req.session.user.salt, req.session.user.ethPrivateKey, req.session.user.ethIv);
    console.log("ETH Private Key: " + privateKey);

    if (ethAmount === undefined || ethAmount === "") {
        req.flash('error', "La quantité doit être donnée.");
        res.redirect("/transfer");
        return;
    }

    if (isNaN(ethAmount)) {
        req.flash('error', "La quantité doit être un chiffre.");
        res.redirect("/transfer");
        return;
    }
    if (parseFloat(ethAmount) < 0) {
        req.flash('error', "La quantité ne peut pas être inférieur à 0.");
        res.redirect("/sell");
        return;
    }

    if (address === undefined || address === "") {
        req.flash('error', "L'addresse ne peut pas être vide.");
        res.redirect("/transfer");
        return;
    }

    if (!web3.utils.isAddress(address)) {
        req.flash('error', "L'addresse n'est pas valide, assurez-vous d'utiliser une addresse sur le réseau ETH.");
        res.redirect("/transfer");
        return;
    }

    try {
        let txId = await sendEthereum(address, ethAmount);
        req.flash('success', ethAmount + " ETH envoyé avec succès à " + address
            + ". <a target='_blank' href='https://sepolia.etherscan.io/tx/" + txId + "'>Information Transaction" + "</a>.");
        await transactionLogger.addTransaction(req, "Transfert", "ETH", publicAddress, address, ethAmount);
        delete req.session.mfaCheck;
        res.redirect("/home");
    } catch (e) {
        req.flash('error', e.message);
        res.redirect("/transfer");
    }
}

async function buyETH(req, res, user) {
    let amount = req.body.amount;
    let address = req.session.user.ethPublicKey;
    publicAddress = global.ethBankPublicKey;
    privateKey = global.ethBankPrivateKey;

    if (amount === undefined || amount === "") {
        req.flash('error', "Un montant doit être donnée.");
        res.redirect("/buyCrypto");
        return;
    }

    if (isNaN(amount)) {
        req.flash('error', "Le montant doit être un chiffre.");
        res.redirect("/buyCrypto");
        return;
    }
    if (parseFloat(amount) < 0) {
        req.flash('error', "Le montant ne peut pas être inférieur à 0.");
        res.redirect("/sell");
        return;
    }

    if (parseFloat(amount) > req.session.user.fiats) {
        req.flash('error', "Vous n'avez pas assez de fond.");
        res.redirect("/buyCrypto");
        return;
    }

    const ethAmount = await fiatsConverter(parseFloat(amount), false);
    if (ethAmount === undefined || ethAmount === 0) {
        req.flash('error', "Le système de transaction n'est pas fonctionnel. Réesayer plus tard.");
        res.redirect("/buyCrypto");
        return;
    }

    if (address === undefined || address === "") {
        req.flash('error', "Le système de transaction n'est pas fonctionnel. Réesayer plus tard.");
        res.redirect("/buyCrypto");
        return;
    }

    if (!web3.utils.isAddress(address)) {
        req.flash('error', "Le système de transaction n'est pas fonctionnel. Réesayer plus tard.");
        res.redirect("/buyCrypto");
        return;
    }

    try {
        let txId = await sendEthereum(address, ethAmount);
        req.flash('success', ethAmount + " ETH " + "(" + amount + " $CAD)" + " envoyé avec succès à votre compte"
            + ". <a target='_blank' href='https://sepolia.etherscan.io/tx/" + txId + "'>Information Transaction" + "</a>.");
        user.fiats = (parseFloat(user.fiats) - parseFloat(amount));
        user.save();
        req.session.user.fiats = parseFloat(user.fiats);
        await transactionLogger.addTransaction(req, "Achat", "ETH", publicAddress, address, ethAmount);
        await transactionLogger.addTransaction(req, "Transfert", "Fiats", "Votre compte", "Cryptova", amount);
        delete req.session.mfaCheck;
        res.redirect("/home");
    } catch (e) {
        req.flash('error', e.message);
        res.redirect("/buyCrypto");
    }
}

async function sellETH(req, res, user) {
    let ethAmount = req.body.amount;
    let address = global.ethBankPublicKey;
    publicAddress = req.session.user.ethPublicKey;
    privateKey = encryptionService.decrypt(req.session.password, req.session.user.salt, req.session.user.ethPrivateKey, req.session.user.ethIv);

    if (ethAmount === undefined || ethAmount === "") {
        req.flash('error', "La quantité doit être donnée.");
        res.redirect("/sell");
        return;
    }

    if (isNaN(ethAmount)) {
        req.flash('error', "La quantité doit être un chiffre.");
        res.redirect("/sell");
        return;
    }
    if (parseFloat(ethAmount) < 0) {
        req.flash('error', "La quantité ne peut pas être inférieur à 0.");
        res.redirect("/sell");
        return;
    }

    if (address === undefined || address === "") {
        req.flash('error', "L'addresse ne peut pas être vide.");
        res.redirect("/sell");
        return;
    }

    if (!web3.utils.isAddress(address)) {
        req.flash('error', "L'addresse n'est pas valide, assurez-vous d'utiliser une addresse sur le réseau ETH.");
        res.redirect("/sell");
        return;
    }

    try {
        let txId = await sendEthereum(address, ethAmount);
        const cadAmount = await fiatsConverter(parseFloat(ethAmount), true);
        req.flash('success', ethAmount + " ETH envoyé avec succès à " + "Cryptova. Vous avez été payé " + cadAmount.toFixed(2) + " $CAD"
            + ". <a target='_blank' href='https://sepolia.etherscan.io/tx/" + txId + "'>Information Transaction" + "</a>.");
        user.fiats = (parseFloat(user.fiats) + cadAmount).toFixed(2);
        user.save();
        req.session.user.fiats = (parseFloat(req.session.user.fiats) + cadAmount).toFixed(2);
        await transactionLogger.addTransaction(req, "Vente", "ETH", publicAddress, address, ethAmount);
        await transactionLogger.addTransaction(req, "Transfert", "Fiats", "Cryptova", "Votre compte", cadAmount.toFixed(2));
        delete req.session.mfaCheck;
        res.redirect("/home");
    } catch (e) {
        req.flash('error', e.message);
        res.redirect("/sell");
    }
}

async function sendEthereum(toAddress, ethAmount) {
    const txInfo = {
        from: publicAddress,
        to: toAddress,
        value: web3.utils.toWei(ethAmount.toString(), "ether"),
        gas: '21000'
    };
    const tx = await web3.eth.accounts.signTransaction(txInfo, privateKey);
    const result = await web3.eth.sendSignedTransaction(tx.rawTransaction);
    return result.transactionHash;
}

async function fiatsConverter(amount, amountIsCrypto) {
    await convert.ready();
    if (amountIsCrypto) {
        return convert.ETH.CAD(amount);
    }
    return convert.CAD.ETH(amount);
}

module.exports = {
    generateWallet,
    getBalance,
    transferETH,
    buyETH,
    sellETH,
    fiatsConverter,
};