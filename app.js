require("dotenv").config()
const express = require("express")
const app = express()
// Import MongoClient
const { MongoClient } = require("mongodb")

const PORT = process.env.PORT || 4000
const HOST = process.env.HOST
const DB_URL = process.env.DB_URL

// Instantiate new instance of client with our db url
const client = new MongoClient(DB_URL)

async function db() {
    try {
        await client.connect()
        const collection = await client.db("mongoqueries").collection("inventory")

        // await collection.insertMany([
        //     { item: "journal", qty: 25, size: { h: 14, w: 21, uom: "cm" }, status: "A" },
        //     { item: "notebook", qty: 50, size: { h: 8.5, w: 11, uom: "in" }, status: "A" },
        //     { item: "paper", qty: 100, size: { h: 8.5, w: 11, uom: "in" }, status: "D" },
        //     { item: "planner", qty: 75, size: { h: 22.85, w: 30, uom: "cm" }, status: "D" },
        //     { item: "postcard", qty: 45, size: { h: 10, w: 15.25, uom: "cm" }, status: "A" }
        //  ])

        return collection
    } catch(err) {
        console.log(err)
    }
}

app.use(express.json())

app.get("/", async (_, res) => {
    const connect = await db()
    // .find() returns cursor object. Need .toArray() to return data from db
    const findAll = await connect.find().toArray()
    console.log(findAll)
    // OR loop over the cursor
    // findAll.forEach(doc => console.log(doc))

    findAll.length == 0
    ? res.status(404).json({
        message: `Not found`
    })
    : res.status(200).json({
        // Spread Operator Destructures findAll array
        ...findAll
    })
})

app.get("/findone/:item", async (req, res) => {
    const { item } = req.params
    const connect = await db()
    // Specifies the property within doc we're looking against
    const findItem = await connect.find({ item: item }).toArray()
    // This will work because we called our property item as it's in the db
    // let findItem = await connect.find({ item }).toArray()
    
    findItem.length == 0
    ? res.status(404).json({
        message: `Not found`
    })
    : res.status(200).json({
        // Spread Operator Destructures findAll array
        ...findItem
    })
})

app.get("/findone/:item/:status", async (req, res) => {
    const { item, status } = req.params
    
    const connect = await db()
    const findItem = await connect.find({ item, status }).toArray()
    
    findItem.length == 0
    ? res.status(404).json({
        message: `Not found`
    })
    : res.status(200).json({
        // Spread Operator Destructures findAll array
        ...findItem
    })
})

app.get("/general", async (req, res) => {
    const connect = await db()
    // $or operator allows us to look for one query or another
    let orOperator = await connect.find({
        $or: [
            // Querying of a nested document
            { size: { h: 8.5 } },
            { item: "notebook"}
        ]
    }).toArray()
    
    // $gt/$gte or $lt/$lte operator allows us to look for a number range
    // .sort() allows us to present data in ascending (1) or descending (-1) order
    let gtOperator = await connect.find({ qty: { $gt: 0, $lte: 100 } }).sort({qty: -1}).toArray()
    // Query for property within a set
    // Allows to find many values for the same property of a document
    let inSet = await connect.find({ item: { $in: ["journal", "notebook"] }}).toArray()
    
    res.status(200).json({
        // orOperator
        // gtOperator
        inSet
    })
    await client.close()
})

// Sort example endpoint using options object within .find() method
app.get("/sortexample", async (req, res) => {
    const connect = await db()
    // Sort by size.h in descending order
    const findItem = await connect.find({ }, { sort: ["size.h", "desc"]}).toArray()
    // This can be done using the following syntax: 
    const findItemAlt = await connect.find({ }, { sort: { "size.h": -1 }}).toArray()
    console.log(findItemAlt)

    findItem.length == 0
    ? res.status(404).json({
        message: `Not found`
    })
    : res.status(200).json({
        // Spread Operator Destructures findAll array
        ...findItem
    })
})

app.listen(PORT, HOST, () => {
    console.log(`[server] listening on ${HOST}:${PORT}`)
})