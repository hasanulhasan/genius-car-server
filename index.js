const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const SSLCommerzPayment = require('sslcommerz-lts')
require('dotenv').config();

//sslcommerz
const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASSWORD;
const is_live = false; //true for live, false for sandbox

//middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zjh2ngr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    const serviceCollection = client.db('geniusCar').collection('services');
    const orderCollection = client.db('geniusCar').collection('orders');
    app.get('/services', async (req, res) => {
      const query = {}
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services)
    });

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    //orders api
    app.get('/orders', async (req, res) => {
      // console.log(req.query.email)
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email
        }
      }
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });


    //this is order placing
    app.post('/orders', async (req, res) => {
      const order = req.body
      const orderedService = await serviceCollection.findOne({ _id: ObjectId(order.service) })
      // console.log(orderedService)
      transactionId = new ObjectId().toString();
      const data = {
        total_amount: orderedService.price,
        currency: order.currency,
        tran_id: transactionId, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/success?transactionId=${transactionId}`,
        fail_url: 'http://localhost:5000/payment/fail',
        cancel_url: 'http://localhost:5000/payment/cancel',
        ipn_url: 'http://localhost:3000/ipn',
        shipping_method: 'Courier',
        product_name: order.serviceName,
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: order.customerName,
        cus_email: order.email,
        cus_add1: order.address,
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: order.postCode,
        ship_country: 'Bangladesh',
      };
      // console.log(data)
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)

      sslcz.init(data).then(apiResponse => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        // res.redirect(GatewayPageURL)
        console.log(GatewayPageURL);
        orderCollection.insertOne({
          ...order,
          transactionId,
          paid: false
        })
        res.send({ url: GatewayPageURL });
      });

    });

    app.post('/payment/success', async (req, res) => {
      const { transactionId } = req.query;
      const result = await orderCollection.updateOne(
        { transactionId }, 
        { $set: { paid: true , paidAt: new Date() } }
      )
      if (result.modifiedCount > 0) {
        res.redirect(`http://localhost:3000/payment/success?transactionId=${transactionId}`)
      }
    })
    
    app.post('/payment/fail', async (req, res) => {
        res.redirect(`http://localhost:3000/`)
    })

    app.get('/orders/by-transaction-id/:id', async (req, res)=> {
      const { id } = req.params;
      const order = await orderCollection.findOne({transactionId: id});
      res.send(order);
    })

    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    app.patch('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const status = req.body.status
      const query = { _id: ObjectId(id) }
      const updatedDoc = {
        $set: {
          status: status
        }
      }
      const result = await orderCollection.updateOne(query, updatedDoc)
      res.send(result);
    })

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