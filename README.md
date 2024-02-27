To make the application work, you need to add a BTC and ETH test account in the global value in app.js . Make sure it has coins in it as they will be used as the bank of the application.

For Twilio, you need to get your accountSid and authToken and put it in app/services/twilioServices.js
You also need to get your block cypher token and put it in app/helpers/btcAccountHelper.js
You also need to create an infura account and add the api link to app/helpers/ethAccountHelper.js

# SENDGRID
You also need to add a sendgrid api key in the sendgrid.env and in the app/services/sendGridService.js to make the email work.
In the same sendGridService, you will need to add the email you used with your sendGridService as well as the template id of the email you have created.

# Twilio
You need to add your twilio phone number in app/services/twilioServices where there is the comments