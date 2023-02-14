const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require("mongodb")
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

function verifyJWT(req, res, next) {
    const authJwt = req.headers.authorization;
    console.log(authJwt)
    if (!authJwt) {
        return res.status(401).send({ message: 'first unauthorized access' });
    }
    const token = authJwt.split(' ')[1];
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'second unauthorized access' });
        }
        req.decoded = decoded;
        next();
    });
}

async function dbConnect() {

    try {

        const serviceCollection = client.db('pureHeart').collection('services');
        const donateCollection = client.db('pureHeart').collection('donate');
        const reviewCollection = client.db('pureHeart').collection('review');

        // jwt api
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, { expiresIn: '1d' })
            res.send({ token })
        })

        app.post('/service', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service)
            res.send(result)
        });

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const service = await cursor.toArray();
            res.send(service)
        });

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await serviceCollection.findOne(query);
            res.send(result)
        });

        app.put('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const option = { upsert: true };
            const service = req.body;
            const updateService = {
                $set: {
                    title: service.title,
                    photoURL: service.photoURL,
                    message: service.message
                }
            }
            const result = await serviceCollection.updateOne(query, updateService, option);
            console.log(result)
            res.send(result)
        })

        // donate api
        app.post('/donate', async (req, res) => {
            const donate = req.body;
            const result = await donateCollection.insertOne(donate);
            res.send(result)
        });

        app.get('/donate', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            console.log('Decoded email ', decoded)
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'forbidden access' })
            }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = donateCollection.find(query);
            const donate = await cursor.toArray();
            res.send(donate)
        });

        app.delete('/donate/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await donateCollection.deleteOne(query);
            res.send(result)
        });

        // Review API
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result)
            console.log(result)
        });

        app.get('/review/', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const review = await cursor.toArray();
            res.send(review)
        });

        app.get('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await reviewCollection.findOne(query);
            res.send(result)
        });




    }
    finally {

    }

}
dbConnect().catch(error => console.error(error))

app.get('/', (req, res) => {
    res.send('Pure heart server is running')
});

app.listen(port, () => {
    console.log(`Pure heart server is running on port ${port}`)
})