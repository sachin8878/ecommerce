const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const fileUpload = require('express-fileupload');
const expressSession = require('express-session');

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());

const sessionConfig = {
    secret: 'Ecommerce',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        path: '/',
        maxAge: 1000 * 60 * 60 * 60 * 24
    }
};

app.use(expressSession(sessionConfig));

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Admin123',
    database: 'ecommerce'
}

const connection = mysql.createConnection(dbConfig);
connection.connect(function (error) {
    if (error) {
        console.log(error);
    } else {
        console.log("Database Connected");
    }
});

app.get('/', validateUser, async function (req, res) {
    try {
        let data = {
            title: 'Products',
            pageName: 'home',
            status:'',
            message:'',
            userLoggedIn: false
        };
        if(req.session.isUserLoggedIn){
            data.userLoggedIn = true;
        }
        if(req.session.status){
            data.status = req.session.status;
            delete  req.session.status;
        }
        if(req.session.message){
            data.message = req.session.message;
            delete  req.session.message;
        }

        let product = await getProducts();
        data.product = product;
        res.render('template', data)
    } catch (error) {
        console.log(error);
    }
});

async function getProducts() {
    return new Promise(function (resolve, reject) {
        const getProduct = `SELECT * FROM products`;
        connection.query(getProduct, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        })

    })
}

app.get('/create-product',validateUser, function (req, res) {
    let data = {
        title: 'Create Product',
        pageName: 'create-product',
        status:'',
        message:'',
        userLoggedIn: false
    };
    if (req.session.isUserLoggedIn) {
        data.userLoggedIn = true;
    }
    if (req.session.status) {
        data.status = req.session.status;
        delete req.session.status;
    }
    if (req.session.message) {
        data.message = req.session.message;
        delete req.session.message;
    }
    res.render('template', data)
});

app.post('/create-product', async function (req, res) {
    console.log(req.body);
    try {
        let productData = {
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            quantity: req.body.quantity,
            featured: req.body.featured,
            category: req.body.category
        }

        const productImage = req.files.productimage;
        const imageName = productImage.name;
        const imageNameArr = imageName.split('.');
        const imgExtenstion = imageNameArr.splice(-1);
        const currentTime = new Date().getTime();
        const random = Math.round(Math.random(1111, 999999) * 10000)
        const imageNewName = `${currentTime}_${random}.${imgExtenstion}`;
        productData.imageNewName = imageNewName;
        console.log(req.files);

        let imageUpload = await uploadImage(productImage, imageNewName);
        let productinsert = await insertProduct(productData);

        res.redirect('/');

    } catch (error) {
        console.log(error);
    }
});

async function uploadImage(productImage, imageNewName) {
    return new Promise(function (resolve, reject) {
        let uploadPath = `${__dirname}/public/profile-images/${imageNewName}`;
        productImage.mv(uploadPath, async function (error) {
            if (error) {
                reject(error);
            } else {
                resolve(true);
            }
        })
    })
}

async function insertProduct(productData) {
    return new Promise(function (resolve, reject) {
        const createProduct = `INSERT INTO products(title, image, description, price, quantity, featured, category) VALUES('${productData.title}', '${productData.imageNewName}', '${productData.description}', '${productData.price}', '${productData.quantity}', '${productData.featured}', '${productData.category}')`;
        connection.query(createProduct, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        })
    })
}

app.get('/edit-product',validateUser, async function (req, res) {
    try {
        let data = {
            title: 'Edit Product',
            pageName: 'edit-product',
            status:'',
            message:'',
            userLoggedIn: false
        }
        if (req.session.isUserLoggedIn) {
            data.userLoggedIn = true;
        }
        if (req.session.status) {
            data.status = req.session.status;
            delete req.session.status;
        }
        if (req.session.message) {
            data.message = req.session.message;
            delete req.session.message;
        }
        const proId = req.query.productId;
        let Allproduct = await getAllProducts(proId);
        let productData = Allproduct[0];
        console.log("productData :", productData);
        data.product = productData;
        res.render('template', data);
    } catch (error) {
        console.log(error);
    }
});

async function getAllProducts(proId) {
    return new Promise(function (resolve, reject) {
        const getSingleProduct = `SELECT * FROM products WHERE id= '${proId}'`;
        connection.query(getSingleProduct, function (error, result) {
            if (error) {
                reject(error)
            } else {
                resolve(result);
            }
        })
    })
}


app.post('/update-product', async function (req, res) {
    console.log(req.body);
    console.log(req.query);
    console.log("req.files", req.files);
    try {
        let proData = {
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            quantity: req.body.quantity,
            featured: req.body.featured,
            category: req.body.category,
            productId: req.query.productId
        }
        let imageNewName = '';

        if (req.files && req.files.productimage) {
            const productImage = req.files.productimage;
            const ImageName = productImage.name;
            const imageNameArr = ImageName.split('.');
            const imgExtenstion = imageNameArr.splice(-1);
            const currentTime = new Date().getTime();
            const random = Math.round(Math.random(1111, 999999) * 10000);
            imageNewName = `${currentTime}_${random}.${imgExtenstion}`;
            console.log("ImageNewName :", imageNewName);
            proData.imageNewName = imageNewName;
            console.log("proData :", proData);
            let imageUpload = await uploadImage(productImage, imageNewName);
        }
        await updateProduct(proData);
        res.redirect('/');

    } catch (error) {
        console.log(error);
    }
});
async function updateProduct(proData) {
    return new Promise(function (resolve, reject) {
        let updateProduct = `UPDATE products SET title='${proData.title}', description='${proData.description}', price='${proData.price}', quantity='${proData.quantity}', featured='${proData.featured}', category='${proData.category}'`;
        if (proData.imageNewName) {
            updateProduct += `, image='${proData.imageNewName}'`
        }
        updateProduct += `WHERE id='${proData.productId}'`;
        connection.query(updateProduct, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        })
    })
}

app.get('/delete-product', async function (req, res) {
    try {
        const proId = req.query.productId;
        let deleteproduct = await deleteProducts(proId);
        res.redirect('/');
    } catch (error) {
        console.log(error);
    }
});
async function deleteProducts(proId) {
    return new Promise(function (resolve, reject) {
        const deleteProduct = `DELETE FROM  products WHERE id = '${proId}'`;
        connection.query(deleteProduct, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        })
    })
}

app.get('/shop',validateUser,async function (req, res) {
    try {
        let data = {
            title: 'Shop',
            pageName: 'shop',
            status:'',
            message:'',
            userLoggedIn: false
        };
        if (req.session.isUserLoggedIn) {
            data.userLoggedIn = true;
        }
        if (req.session.status) {
            data.status = req.session.status;
            delete req.session.status;
        }
        if (req.session.message) {
            data.message = req.session.message;
            delete req.session.message;
        }
       let products = await getProduct();
       data.product = products;
       res.render('template', data);
    } catch (error) {
        console.log(error);
    }
});

async function getProduct(){
    return new Promise(function(resolve,reject){
        const getProduct = `SELECT * FROM products`;
        connection.query(getProduct, function(error, result){
            if(error){
                reject(error);
            }else{
                resolve(result);
            }
        })
    })
}

app.get('/register',backDoorEntry, function (req, res) {
    let data = {
        title: 'Registration',
        pageName: 'register',
        userLoggedIn: false
    };
    if(req.session.isUserLoggedIn){
        data.userLoggedIn = true;
    }
    res.render('template', data)
});

app.post('/create-user', function (req, res) {
    console.log(req.body);
    const {firstName,lastName,userEmail,contact,gender,aboutAuthor,password} = req.body;
    console.log(req.files);
    const profileImage = req.files.authorProfile;
    const imageName = profileImage.name;
    const imageNameArr = imageName.split('.');
    const imgExtenstion = imageNameArr.splice(-1);
    const currentTime = new Date().getTime();
    const random = Math.round(Math.random(1111, 999999) * 10000);
    const imageNewName = `${currentTime}_${random}.${imgExtenstion}`;
    console.log("imageNewName", imageNewName);

    let uploadPath = `${__dirname}/public/profile-images/${imageNewName}`;
    profileImage.mv(uploadPath, function (error, result) {
        if (error) {
            console.log(error);
        } else {
            const createUser = `INSERT INTO users(first_name, last_name, email, contact, gender,about, profile, password) VALUES('${firstName}','${lastName}','${userEmail}','${contact}', '${gender}', '${aboutAuthor}', '${imageNewName}', '${password}')`;
            console.log(createUser);
            connection.query(createUser, function (error, result) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(result);
                    res.redirect('/register')
                }
            })
        }
    })
});

app.get('/login',backDoorEntry, function (req, res) {
    let data = {
        title: 'Login Portal',
        pageName: 'login',
        status: '',
        message: '',
        userLoggedIn: false
    };
    if (req.session.status) {
        data.status = req.session.status;
        delete req.session.status;
    }
    if (req.session.message) {
        data.message = req.session.message;
        delete req.session.message;
    }
    res.render('template', data)
});

app.post('/login', async function (req, res) {
    console.log(req.body);
    try {
        const email = req.body.username;
        const password = req.body.password;
        await userLogin(email,password);
    } catch (error) {
        console.log(error);
    }

    async function userLogin(emailId,password){
        return new Promise (function(resolve, reject){
            const getSingleUser = `SELECT * FROM users WHERE email= '${emailId}'`;
            console.log(getSingleUser);
            connection.query(getSingleUser, function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                    if (result.length > 0) {
                        if (result[0].password == password) {
                            console.log("user verified");
                            req.session.message = "Succcessfullly Logged In";
                            req.session.isUserLoggedIn = result[0].id;
                            res.redirect('/');
        
                        } else {
                            console.log("incorrect password");
                            req.session.status = "Error"
                            req.session.message = "Incorrect password";
                            res.redirect('/login')
                        }
                    } else {
                        console.log("email not found");
                        req.session.status = "Error"
                        req.session.message = "Invalid email";
                        res.redirect('/login')
                    }
                }
            })
        });
    }
});
    
app.get('/cart',validateUser, function (req, res) {
    let data = {
        title: 'Cart List',
        pageName: 'cart',
        status:'',
        message:'',
        userLoggedIn: false
    };
    if (req.session.isUserLoggedIn) {
        data.userLoggedIn = true;
    }
    if (req.session.status) {
        data.status = req.session.status;
        delete req.session.status;
    }
    if (req.session.message) {
        data.message = req.session.message;
        delete req.session.message;
    }
    const cartData = {
        userId: req.session.isUserLoggedIn,
        productId: req.query.productId,
    }
    console.log('itemId', cartData);
    data.cartItem = cartData;
    res.render('template', data)
});

app.get('/logout', function(req, res){
    if(req.session.isUserLoggedIn){
        delete req.session.isUserLoggedIn;
    }
    res.redirect('/login');
});

function validateUser(req, res, next){
    if(!req.session.isUserLoggedIn){
        req.session.status = 'Error';
        req.session.message = "Session Expired";
        res.redirect('/login');
    }else{
        next();
    }
}

function backDoorEntry(req, res, next){
    if(req.session.isUserLoggedIn){
        res.redirect('/');
    }else{
        next();
    }
}

const port = 5000;
app.listen(port, function () {
    console.log(`Server Started at Port ${port}`);
});