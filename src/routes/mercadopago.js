const { Router } = require('express');
const mercadopago = require("mercadopago");


// Almacenamos en memoria la pKey y el accessToken
const mercadoPagoPublicKey = process.env.MERCADO_PAGO_SAMPLE_PUBLIC_KEY;
const mercadoPagoAccessToken = process.env.MERCADO_PAGO_SAMPLE_ACCESS_TOKEN;

// Verificamos que se hayan seteado
if (!mercadoPagoPublicKey || !mercadoPagoAccessToken) {
    !mercadoPagoPublicKey ? console.log("Error: public key not defined") : console.log("Error: Access Token not defined");
}

// Steamos el Access Token
mercadopago.configurations.setAccessToken(mercadoPagoAccessToken);


const router = Router();

// Registro de articulos
router.post('/process_payment', async (req, res, next) => {
    const { body } = req;
    const { payer } = body;
    
    const paymentData = {
      transaction_amount: Number(body.transactionAmount),
      token: body.token,
      //description: body.description,
      installments: Number(body.installments),
      payment_method_id: body.paymentMethodId,
      //issuer_id: body.issuerId,
      payer: {
        email: payer.email,
        /*identification: {
          type: payer.identification.docType,
          number: payer.identification.docNumber
        }*/
      }
    };
    
    // Guardar pago
    mercadopago.payment.save(paymentData)
    .then(function(response) { // fulfilled
      const { response: data } = response;
      res.status(response.status).json({
        status_detail: data.status_detail,
        status: data.status,
        id: data.id
      });
    })
    .catch(function(error) { // error
      res.status(error.status).send(error);
    });
});

// Test
router.get('/', (req, res) => {
    res.send("Mercadopago");
})

module.exports = router;