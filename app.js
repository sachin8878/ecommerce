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
    database: 'project'
}

const connection = mysql.createConnection(dbConfig);
connection.connect(function (error) {
    if (error) {
        console.log(error);
    } else {
        console.log("Database Connected");
    }
});

app.get('/', async function (req, res) {
    try {
        let data = {
            title: 'Products',
            pageName: 'home'
        };
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

app.get('/create-product', function (req, res) {
    let data = {
        title: 'Create Product',
        pageName: 'create-product'
    };
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

app.get('/edit-product', async function (req, res) {
    try {
        let data = {
            title: 'Edit Product',
            pageName: 'edit-product'
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

app.get('/shop', function (req, res) {
    let data = {
        title: 'Shop',
        pageName: 'shop'
    }
    const getProduct = `SELECT * FROM products`;
    connection.query(getProduct, function (error, result) {
        if (error) {
            console.log(error);
        } else {
            console.log(result);
            data.product = result;
            res.render('template', data)
        }
    })
});

app.get('/register', function (req, res) {
    let data = {
        title: 'Registration',
        pageName: 'register'
    };
    res.render('template', data)
});

app.post('/create-user', function (req, res) {
    console.log(req.body);
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const userEmail = req.body.userEmail;
    const contact = req.body.contact;
    const gender = req.body.gender;
    const aboutAuthor = req.body.aboutAuthor;
    const password = req.body.password;
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

app.get('/login', function (req, res) {
    let data = {
        title: 'Login Portal',
        pageName: 'login',
        status: '',
        message: ''
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

app.post('/login', function (req, res) {
    console.log(req.body);
    const email = req.body.username;
    const password = req.body.password;

    const getSingleUser = `SELECT * FROM users WHERE email= '${email}'AND password= '${password}'`;
    console.log(getSingleUser);
    connection.query(getSingleUser, function (error, result) {
        if (error) {
            console.log(error);
        } else {
            console.log( "result :",result);
            if (result && result.length > 0) {
                console.log("Data found", result);
                req.session.status = "Success";
                req.session.message = "Succcessfullly Logged In";
                req.session.isUserLoggedIn = result[0].id;
                    console.log("req.session.isUserLoggedIn",req.session.isUserLoggedIn)
                res.redirect('/login')
            } else {
                console.log("No Data found");
                req.session.status = 'Error';
                req.session.message = "Invalid Credentials";
                res.redirect('/login')
            }
        }
    })
});

app.get('/cart', function (req, res) {
    let data = {
        title: 'Cart List',
        pageName: 'cart'
    };
    const cartData = {
        userId : req.session.isUserLoggedIn,
        cartId : req.query.productId,
    }
    console.log('itemId',cartData);
    data.cartItem = cartData;
    res.render('template', data)
});

const port = 5000;
app.listen(port, function () {
    console.log(`Server Started at Port ${port}`);
});