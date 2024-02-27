var express = require('express');
const btcWalletModule = require("../app/helpers/btcAccountHelper");
const ethWalletModule = require("../app/helpers/ethAccountHelper");
const userBroker = require("../brokers/userBroker");
var router = express.Router();
router.get('/', async function(req, res) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    if (!req.session.mfaCheck) {
        if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
            req.session.mfaCheck = {
                redirect: "/buyCrypto",
                hasSentCode: false,
                confirmed: false
            };
            res.redirect("/checkMFA");
            return;
        }
    } else {
        if (!req.session.mfaCheck.redirect !== "/buyCrypto") {
            if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
                req.session.mfaCheck.redirect = "/buyCrypto";
            }
        }
        if (!req.session.mfaCheck.confirmed) {
            if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
                res.redirect("/checkMFA");
                return;
            }
        }
    }
    let btcAmount;
    try {
        btcAmount =  await btcWalletModule.getBalance(req.session.user.btcPublicKey);
    } catch (e) {
        btcAmount = 0;
    }
    const ethAmount = await ethWalletModule.getBalance(req.session.user.ethPublicKey);
    const btcValue = await btcWalletModule.fiatsConverter(1, true);
    const ethValue = await ethWalletModule.fiatsConverter(1, true);
    if (req.session.isBTC) {
        res.render("buyCrypto", {isBTC: true,  ethValue: ethValue.toFixed(2), btcValue: btcValue.toFixed(2), username: req.session.user.username, btcAmount: btcAmount, ethAmount: ethAmount, fiatsAmount: req.session.user.fiats, error: req.flash('error'), success: req.flash('success')});
    } else {
        res.render("buyCrypto", {isBTC: false, ethValue: ethValue.toFixed(2), btcValue: btcValue.toFixed(2),  username: req.session.user.username, btcAmount: btcAmount, ethAmount: ethAmount, fiatsAmount: req.session.user.fiats, error: req.flash('error'), success: req.flash('success')});
    }

});

router.post('/', async function(req, res) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    if (!req.session.mfaCheck) {
        if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
            req.session.mfaCheck = {
                redirect: "/buyCrypto",
                hasSentCode: false,
                confirmed: false
            };
            res.redirect("/checkMFA");
            return;
        }
    } else {
        if (!req.session.mfaCheck.confirmed) {
            if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
                res.redirect("/checkMFA");
                return;
            }
        }
    }
    let user = await userBroker.getUserById(req.session.user._id);
    if (req.body.radioCrypto === 'btc') {
        await btcWalletModule.buyBitcoin(req, res, user);
        return;
    }
    await ethWalletModule.buyETH(req, res, user);
});


router.get('/btc', async function(req, res) {
    req.session.isBTC = true;
    res.redirect("/buyCrypto");
});


router.get('/eth', async function(req, res) {
    req.session.isBTC = false;
    res.redirect("/buyCrypto");
});

module.exports = router;