const { Router } = require('express');
const usersRoute = require('./users.js')
const articlesRoute = require('./articles.js')
const donationsRoute = require('./donations.js')
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');

const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
router.use("/users", usersRoute);
router.use("/articles", articlesRoute);
router.use("/donations", donationsRoute);
// Main path
router.get('/', (req, res) => {
    res.send("index");
})

module.exports = router;
