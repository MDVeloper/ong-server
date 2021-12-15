const { Router } = require('express');
const { Users, Transactions, Articles } = require('../db.js');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');

const router = Router();

// Registro de articulos
router.post('/creacion', async (req, res, next) => {
    const { title, img, description, category, status } = req.body;


    if(category !== "Projects") {
        try {
            console.log("Backkkkkkkkkkkkkkkkkkkkkkkkk",req.body)
    
    
            let aux = category !== "Projects" ? "" : status
    
            let articleInstance = await Articles.create({
                title: title,
                img: img,
                description: description,
                category: category,
                voteCount: 0
            });
    
            res.status(200).json(articleInstance);
        }
        catch (error) {
            next(error);
        }
    }else {
        try {
    
            let articleInstance = await Articles.create({
                title: title,
                img: img,
                description: description,
                category: category,
                voteCount: 0,
                status: status
            });
    
            res.status(200).json(articleInstance);
        }
        catch (error) {
            next(error);
        }
    }
   

})

// Solicitud de articulos
router.get('/', async (req, res, next) => {

    const { id } = req.query;
    const { category } = req.query;

    if (id) {
        try {
            let article = await Articles.findByPk(id);
            return article ? res.status(200).json(article) : res.status(200).send("No se encontro este articulo.");
        } catch (error) {
            next(error);
        }
    }
    else if (category) {
        if (category === "News" || category === "Projects" || category === "Course") {
            try {
                let article = await Articles.findAll({
                    where: {
                        category: category,
                    }
                });

                return article ? res.status(200).json(article) : res.status(200).send("No se encontraron articulos para esa category");
            }
            catch (error) {
                next(error);
            }
        }
        else {
            return res.status(200).send("Ingresaste una categoria que no existe.");
        }

    }
    else {
        let allArticles = await Articles.findAll({
            attributes: ["id", "title", "img", "description", "category", "voteCount", "status", "createdAt"],
        });
        //Promise.all(allUsers).then(resp => res.status(200).json(allArticles));
        return res.status(200).json(allArticles);
    };

})

// Ruta para traer por ir
router.get("/:id", (req, res, next) => {
    const articleid = req.params.id

    if (articleid) {
        try {
            let article = Articles.findByPk(articleid);

            return res.status(200).json(article);
        } catch (error) {
            next(error)
        }
    }
})

// Modificacion de articulos
router.put('/:id', async (req, res, next) => {
    const { title, img, description, category, status } = req.body;
    const { id } = req.params;
    
    if( category === "Projects") {
        try {

    
            console.log("Soy el id para editaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", id)
    
            let article = await Articles.findByPk(id);
    
            let titleUpdated = title ? title : article.title;
            let imgUpdated = img ? img : article.img;
            let descriptionUpdated = description ? description : article.description;
            let categoryUpdated = category ? category : article.category;
            let statusUpdated = status ? status : article.status
    
    
            let updated = await article.update({
                title: titleUpdated,
                img: imgUpdated,
                description: descriptionUpdated,
                category: categoryUpdated,
                status: statusUpdated
            });
    
            res.status(200).json(updated)
    
        } catch (error) {
            next(error)
        }
    }
    else {
        try {
            console.log("Soy el id para editaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", id)
    
            let article = await Articles.findByPk(id);
    
            let titleUpdated = title ? title : article.title;
            let imgUpdated = img ? img : article.img;
            let descriptionUpdated = description ? description : article.description;
            let categoryUpdated = category ? category : article.category;
    
    
            let updated = await article.update({
                title: titleUpdated,
                img: imgUpdated,
                description: descriptionUpdated,
                category: categoryUpdated
            });
    
            res.status(200).json(updated)
    
        } catch (error) {
            next(error)
        }
    }
   


    

})




// Modificaion de la cantidad de votos que tiene proyecto
router.put('/vote/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

        let article = await Articles.findByPk(id);
        
        let aux =  data.vote2 === true ? Number(article.voteCount) + 1 : Number(article.voteCount)  - 1;
        
        let updated = await article.update({
            voteCount : aux
        });
        res.status(200).json(updated)

    } catch (error) {
        next(error)
    }
})









// Borrado de articulos
router.delete('/delete', async (req, res, next) => {
    try {
        const { deleteid } = req.query

        await Articles.destroy({
            where: {
                id: deleteid,
            }
        });
        return res.status(200).send("Acticulo eliminado exsitosamente")

    } catch (error) {
        next(error)
    }
});

// Relacionar articulo (curso) a un usuario
router.post('/asign', async (req, res, next) => {
    try {
        const { userId, courseId } = req.body;

        let userInstance = await Users.findByPk(userId);
        let articleInstance = await Articles.findByPk(courseId);

        await articleInstance.setUsers(userInstance)

    } catch(error) {
        next(error);
    }
})

module.exports = router;