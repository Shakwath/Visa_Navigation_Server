const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b73grgu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    const database = client.db("visDB");
    const userscollection = database.collection("visa");
    const applicationsCollection = database.collection("applications");

    
    // multiple document add
    app.get('/allvisa' ,async (req,res) =>{
        const cursor = userscollection.find()
        const result = await cursor.toArray();
        res.send(result);
     })
    
    app.post('/allvisa' ,async(req, res)=>{
        const visaData = req.body;
        console.log("Received Visa:", visaData);
        const result = await userscollection.insertOne(visaData);
        res.send(result);
    })
   
    app.get('/visadetails/:id', async(req,res) =>{
      try {
       const {id}= req.params
       const result = await userscollection.findOne({_id:new ObjectId(id)})
       res.send(result)
      } catch (error) {
        console.log(error)
      }
    })


   // POST → Apply for a visa
    app.post("/applications", async (req, res) => {
      try {
        const appData = req.body;
        console.log(appData);
        if (!appData || !appData.visaId || !appData.email) {
          return res.status(400).send({ message: "visaId and email are required" });
        }

        const result = await applicationsCollection.insertOne(appData);
        res.send({ message: "Application submitted", data: result });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to apply", error: error.message });
      }
    });

    // GET → Applications by email
    app.get("/applications", async (req, res) => {
      try {
        const email = req.query.email;
        const query = email ? { email } : {};
        const result = await applicationsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch applications", error: error.message });
      }
    });

    // DELETE → Cancel application
    app.delete("/applications/:id", async (req, res) => {
      try {
        const { id } = req.params;
        await applicationsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send({ message: "Application canceled" });
      } catch (error) {
        res.status(500).send({ message: "Failed to cancel application", error: error.message });
      }
    });

    // Get visas 
  app.get("/myvisas/:email", async (req, res) => {
    const email = req.params.email;
    const result = await applicationsCollection.find({email}).toArray();
    console.log(result);

    res.send(result);
  });

// Update a visa
app.put("/myvisas/:id", async (req, res) => {
  const id = req.params.id;
  const updatedVisa = req.body;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = { $set: {updatedVisa} };
  const result = await applicationsCollection.updateOne(filter, updateDoc);
  res.send(result);
});

// Delete
app.delete("/myvisas/:id", async (req, res) => {
  const id = req.params.id;
  const result = await applicationsCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) =>{
    res.send('Visa Navigation server is running')
})

app.listen(port, () =>{
    console.log(`Visa Navigation server is running on port: ${port}`)
})