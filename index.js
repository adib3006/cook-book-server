const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('colors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5voiazn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req,res,next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err,decoded){
        if(err){
            return res.status(401).send({message: 'unauthorized access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run(){
    try{
        const menuCollection = client.db('cookBook').collection('menu');        
        const reviewCollection = client.db('cookBook').collection('reviews');
        
        app.post('/jwt', (req,res)=>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'5h'});
            res.send({token});
        })

        app.get('/home',async (req,res)=>{
            const query = {};
            const cursor = menuCollection.find(query);
            const menu =await cursor.sort({_id:-1}).limit(3).toArray();
            res.send(menu);
        });

        app.get('/menu',async (req,res)=>{
            const query = {};
            const cursor = menuCollection.find(query);
            const menu =await cursor.toArray();
            res.send(menu);
        });

        app.get('/menu/:id',async (req,res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const query1 = {item_id:id}
            const item = await menuCollection.findOne(query);
            const cursor = reviewCollection.find(query1);
            const reviews = await cursor.sort({releaseDate:-1}).toArray();
            res.send({item,reviews});
        });

        app.post('/menu',async (req,res)=>{
            const item = req.body;
            const result = await menuCollection.insertOne(item);
            res.send(result);
        });

        app.post('/menu/:id',async (req,res)=>{
            const review = req.body;
            const releaseDate = new Date();
            const reviewWithDate = {...review,releaseDate};
            const result = await reviewCollection.insertOne(reviewWithDate);
            res.send(result);
        });

        app.get('/myreviews', verifyJWT, async (req,res)=>{
            const decoded = req.decoded;
            if(decoded.email !== req.query.email){
                res.status(403).send({message: 'Forbidden access'})
            }
            let query = {};
            if(req.query.email){
                query={
                    email: req.query.email
                }
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        app.delete('/myreviews/:id', verifyJWT, async (req,res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)};
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        });

        app.get('/myreviews/:id', verifyJWT, async (req,res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)};
            const result = await reviewCollection.findOne(query);
            res.send(result);
        });

        app.patch('/myreviews/:id', verifyJWT, async (req,res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)};
            const updatedReview = {
                $set: req.body
            }
            const result = await reviewCollection.updateOne(query,updatedReview);
            res.send(result);
        });
    }
    finally{

    }
}

run().catch(error=>console.log(error));

app.get('/', (req,res)=>{
    res.send('cook book server is up and running');
});

app.listen(port, ()=>{
    console.log('server is running'.bgGreen.black);
})