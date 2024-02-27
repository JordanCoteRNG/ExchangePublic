var express = require('express');
var router = express.Router();
const btcWalletModule = require('../app/helpers/btcAccountHelper');
const ethWalletModule = require('../app/helpers/ethAccountHelper');

/* GET home page. */
router.get('/', async function(req, res, next) {
    delete req.session.mfaCheck;
    if (req.session.user) {
        let btcAmount;
         try {
             btcAmount =  await btcWalletModule.getBalance(req.session.user.btcPublicKey);
        } catch (e) {
            btcAmount = 0;
        }
        const ethAmount = await ethWalletModule.getBalance(req.session.user.ethPublicKey);
        res.render("home", { username: req.session.user.username, btcAmount: btcAmount, ethAmount: ethAmount, fiatsAmount: req.session.user.fiats, transactions: req.session.user.transactionLog.reverse(), error: req.flash('error'), success: req.flash('success')});
        return;
    }
    res.redirect("/logout");
});

module.exports = router;