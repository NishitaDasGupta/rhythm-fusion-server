const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt = require('jsonwebtoken');
// middleware 
app.use(cors());
app.use(express.json());


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401)
            .send({ error: true, message: "UNAUTHORIZED ACCESS " })
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401)
                .send({ error: true, message: "UNAUTHORIZED ACCESS " })
        }
        req.decoded = decoded;
        next();
    })
}






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
        const cartsCollection = client.db("rhythmFusionDb").collection("carts");


        app.post('/jwt', (req, res) => {
            const user = req.body;
            // token e convert korbo  
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })


        // Warning: use verifyJWT before using verifyAdmin
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'Admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }


        // classesCollection
        app.get("/allclasses", async (req, res) => {
            const result = await classesCollection.find().toArray();
            res.send(result);
        })
        //instructor
        app.get("/myclass", verifyJWT, async (req, res) => {
            const myemail = req.query.email;

            if (!myemail) {
                return res
                    .status(401)
                    .send({ error: true, message: "Unauthorized access." })
            }

            if (myemail !== req.decoded.email) {
                return res.status(403)
                    .send({ error: true, message: "Forbidden Access" })
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
            const result = await classesCollection.insertOne(classes);
            res.send(result);
        })

        app.put("/updateclass/:id", async (req, res) => {
            const id = req.params.id;
            const updateClass = req.body;
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
        app.get("/allusers", verifyJWT,verifyAdmin, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })


        app.get("/user/admin/:email", verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.send({ admin: false })
            }
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === "Admin" }
            res.send(result);
        })

        app.get("/user/instructor/:email", verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.send({ instructor: false })
            }
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { instructor: user?.role === "Instructor" }
            res.send(result);
        })

        app.get("/user/student/:email", verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.send({ student: false })
            }
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { student: user?.role === "Student" }
            res.send(result);
        })


        app.post("/users", async (req, res) => {
            const users = req.body;
            // console.log(users);
            const query = { email: users.email };
            const existingEmail = await usersCollection.findOne(query);
            if (existingEmail) {
                return res.send({ error: "user already exists." })
            }
            const result = await usersCollection.insertOne(users);
            res.send(result);
        })


        app.put(`/updateuser/:id`, async (req, res) => {
            const id = req.params.id;
            const updateUser = req.body;
            // console.log(updateUser);
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: updateUser?.role,
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })



        //cartscollection


        app.get("/allcarts", verifyJWT, async (req, res) => {
            const result = await cartsCollection.find().toArray();
            res.send(result);
        })


        app.get("/mycarts", verifyJWT, async (req, res) => {
            const myemail = req.query.studentEmail;
            if (!myemail) {
                return res
                    .status(401)
                    .send({ error: true, message: "Unauthorized access." })
            }
            if (myemail !== req.decoded.email) {
                return res.status(403)
                    .send({ error: true, message: "Forbidden Access" })
            }

            const query = { studentEmail: myemail }
            const result = await cartsCollection.find(query).toArray();
            res.send(result);
        })


        app.post("/selectcart", async (req, res) => {
            const carts = req.body;
            const result = await cartsCollection.insertOne(carts);
            res.send(result);
        })

        app.delete("/deletecart/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartsCollection.deleteOne(query);
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