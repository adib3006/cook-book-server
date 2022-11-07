const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('colors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req,res)=>{
    res.send('cook book server is up and running');
});

app.listen(port, ()=>{
    console.log('server is running'.bgGreen.black);
})