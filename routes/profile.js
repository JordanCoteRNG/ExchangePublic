var express = require('express');
const btcWalletModule = require("../app/helpers/btcAccountHelper");
const ethWalletModule = require("../app/helpers/ethAccountHelper");
const updateModule = require("../app/services/updateProfileService");
var router = express.Router();

/* GET users listing. */
router.get('/', async function(req, res, next) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    let btcAmount;
    try {
        btcAmount =  await btcWalletModule.getBalance(req.session.user.btcPublicKey);
    } catch (e) {
        btcAmount = 0;
    }
    const ethAmount = await ethWalletModule.getBalance(req.session.user.ethPublicKey);
    res.render("profile", { emailMFA: req.session.user.emailMFA, phoneMFA: req.session.user.phoneMFA, authMFA: req.session.user.authMFA, username: req.session.user.username, email: req.session.user.email, phoneNumber: req.session.user.phoneNumber, btcAmount: btcAmount, ethAmount: ethAmount, fiatsAmount: req.session.user.fiats, error: req.flash('error'), success: req.flash('success')});
});

router.post('/update/account-info', async function(req, res) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    await updateModule.updateProfile(req, res);
});

module.exports = router;