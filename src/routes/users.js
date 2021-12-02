const { Router } = require('express');
const { Users, Transactions } = require('../db.js');
var session = require('express-session')
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');

const router = Router();

// Main path
router.get('/', (req, res) => {
    res.send("soy users");
})

// Registro de usuarios
router.post("/registro", async (req, res, next) => {
    try {
        const { name, lastName, password, email, country, state, birthday, privilege, volunteer, course } = req.body;

        let usersInstance = await Users.create({
            name: name,
            lastName: lastName,
            password: password,
            email: email,
            country: country,
            state: state,
            birthday: birthday,
            privilege: privilege,
            volunteer: volunteer,
            course: course,
        });

        res.status(200).json(usersInstance);
    }
    catch (error) {
        next(error);
    }

})

// Get /detail
router.get("/detail", async (req, res, next) => {
    const { id } = req.query;
    let integerId = parseInt(id);

    if (typeof integerId === "number" && !isNaN(integerId)) {
        try {
            let user = await Users.findOne({
                where: {
                    id: integerId,
                }
            });

            let thisUserDonations = await Transactions.findAll({
                where: {
                    email: user.dataValues.email
                },
            }
            );

            user.dataValues.donations = thisUserDonations
            res.status(200).json(user);
        }
        catch (error) {
            next(error);
        }
    }
    else {
        res.status(400).send("Id invalido");
    }

})

// Get /all (debugging)
router.get('/all', async (req, res) => {
    const { email } = req.body;
    let allUsers = await Users.findAll({
        attributes: ["id", "name", "lastName", "password", "email", "country", "state", "birthday", "privilege", "volunteer", "course", "createdAt"],
    });

    for (let i = 0; i < allUsers.length; i++) {
        let thisDonations = await await Transactions.findAll({
            where: {
                email: allUsers[i].dataValues.email
            },
        }
        );
        allUsers[i].dataValues.donations = thisDonations
    }

    return res.status(200).json(allUsers);
})

// Ruta para login

router.get('/login', async (req, res, next) => {
    const { email, password } = req.body;

    if (email && password) {
        try {
            let logUser = await Users.findOne({
                where: {
                    email: email,
                    password: password
                }
            });

            if (logUser) {
                let validUser = true;
                return res.json(validUser)
            }
            else {
                let invalidUser = false;
                return res.json(invalidUser)
            }
        } catch (error) {
            next(error)
        }
    }
    else {
        return res.send("User not found")
    }
});

// Ruta logout
router.get("/logout", async (req, res, next) => {
    req.session.destroy()
});

module.exports = router;

