const { Router } = require('express');
const { Users, Transactions} = require('../db.js');
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

    if (typeof integerId === "number" && !isNaN(integerId)){
        try{
            let user = await Users.findOne({
                where: {
                    id: integerId,
                },
                include: Transactions
            });
        
            res.status(200).json(user);
        }
        catch(error){
            next(error);
        }
    }
    else{
        res.status(400).send("Id invalido");
    }

})

// Get /all (debugging)
router.get('/all', async (req, res) => {

    let allUsers = await Users.findAll({
        attributes: ["id", "name", "lastName", "password", "email", "country", "state", "birthday", "privilege", "volunteer", "course", "createdAt"],
    });
    
    //Promise.all(allUsers).then(resp => res.status(200).json(allUsers));
    return res.status(200).json(allUsers);
})

module.exports = router;
