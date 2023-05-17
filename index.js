const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 4000;
var jwt = require("jsonwebtoken");

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.do2y2gc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verify = (req, res, next) => {
  console.log("hetting verify");
  console.log(req.headers.authorization);
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  console.log(token);

  jwt.verify(token, process.env.ACCESS_TOKEN_SERECT, (error, decoded) => {
    if (error) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const serviceCollection = client.db("carDoctor").collection("services");

    const bookingCollection = client.db("carDoctor").collection("bookings");

    //jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SERECT, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const options = {
        projection: { _id: 1, title: 1, service_id: 1, price: 1, img: 1 },
      };
      const result = await serviceCollection.findOne(quary, options);
      res.send(result);
    });

    //bookings

    app.get("/bookings", verify, async (req, res) => {
      // console.log(req.headers.authorization);
      let quary = {};
      if (req.query?.email) {
        quary = { email: req.query.email };
      }
      const result = await bookingCollection.find(quary).toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.patch("/bookings/:id", async (req, res) => {
      const uptadeBooking = req.body;
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };
      const uptadedDoc = {
        $set: {
          status: uptadeBooking.status,
        },
      };
      const result = await bookingCollection.updateOne(filter, uptadedDoc);
      res.send(result);
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;

      const quary = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(quary);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Doctor is running");
});

app.listen(port, () => {
  console.log(`Car Doctor is running in port ${port}`);
});
