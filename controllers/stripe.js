
const stripe = require('stripe')('sk_test_mkRDwjjammumokJUHQEVVpao')

const stripeRouter = require('express').Router()


stripeRouter.get('/gimmefood_sekred', async (request, response) => {

  const intent = await stripe.paymentIntents.create({
    amount: 1,
    currency: 'gbp',
    // Verify your integration in this guide by including this parameter
    metadata: { integration_check: 'accept_a_payment' },
  })
  response.json({ client_secret: intent.client_secret })

})

module.exports = stripeRouter