const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();

//middle wares
app.use(cors());
app.use(express.json());
//dbuser3
//7UzCUMlgbkH6cxpq

console.log(process.env.DB_USER)
console.log(process.env.DB_PASSWORD)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zjh2ngr.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    const serviceColection = client.db('geniusCar').collection('services');

  }
  finally {

  }

}
run().catch(e => console.error(e))


app.get('/', (req, res) => {
  res.send('genius car server is running');
})

app.listen(port, () => {
  console.log(`Genius Car service on ${port}`)
})