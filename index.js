const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleware 
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_SECRET_KEY}@cluster0.gvng5am.mongodb.net/?retryWrites=true&w=majority`;

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
        //await client.connect();

        const classesCollection = client.db("rhythmFusionDb").collection("classes");
        const instructorsCollection = client.db("rhythmFusionDb").collection("instructors");
        const usersCollection = client.db("rhythmFusionDb").collection("users");

        // classesCollection
        app.get("/allclasses", async (req, res) => {
            const result = await classesCollection.find().toArray();
            res.send(result);
        })

        app.get("/myclass", async (req, res) => {
            const myemail = req.query.email;
            //console.log(myemail);
            if (!myemail) {
                return res
                    .status(401)
                    .send({ error: true, message: "Unauthorized access." })
            }
            const query = { email: myemail }
            const result = await classesCollection.find(query).toArray();
            res.send(result);
        })

        app.get("/findmyoneclass/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await classesCollection.findOne(query);
            res.send(result);
        })

        app.post("/addclass", async (req, res) => {
            const classes = req.body;
            console.log(classes);
            const result = await classesCollection.insertOne(classes);
            res.send(result);
        })

        app.put("/updateclass/:id", async (req, res) => {
            const id = req.params.id;
            const updateClass = req.body;
            console.log({ updateClass });
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            let updateDoc = {};
            if (updateClass?.status) {
                updateDoc = {
                    $set: {
                        status: updateClass?.status,
                    },
                };
                const result = await classesCollection.updateOne(filter, updateDoc, options);
                return res.send(result);
            }
            if (updateClass?.feedback) {
                updateDoc = {
                    $set: {
                        feedback: updateClass?.feedback,
                    },
                };
                const result = await classesCollection.updateOne(filter, updateDoc, options);
                return res.send(result);
            }
            updateDoc = {
                $set: {
                    availableSeats: updateClass?.availableSeats,
                    classImage: updateClass?.classImage,
                    classNam: updateClass?.classNam,
                    price: updateClass?.price,

                },
            };

            const result = await classesCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        // instructorsCollection
        app.get("/instructors", async (req, res) => {
            const result = await instructorsCollection.find().toArray();
            res.send(result);
        })

        // usersCollection 
        app.get("/allusers", async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        app.post("/users", async (req, res) => {
            const users = req.body;
            console.log(users);
            const query = { email: users.email };
            const existingEmail = await usersCollection.findOne(query);
            if (existingEmail) {
                return res.send({ error: "user already exists." })
            }
            const result = await usersCollection.insertOne(users);
            res.send(result);
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Rhythm Fusion Server is comming ....");
})
app.listen(port, () => {
    console.log(`Rhythm Fusion Server is running on port ${port}`);
})