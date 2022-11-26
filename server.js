import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import worldCupData from "./data/world-cup.json";
import listEndpoints from "express-list-endpoints";

function connectoToDB() {
  const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo";

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity 
  };

  mongoose.connect(mongoUrl, options)
    .then(() => {
      if (process.env.RESET_DB) {
        const seedDatabase = async () => {
          await Cup.deleteMany({})

          worldCupData.forEach((data) => {
            new Cup(data).save()
              .then(() => console.log(`Entry created: ${JSON.stringify(data)}`))
          })
        }
        seedDatabase()
      }
    });
  mongoose.Promise = Promise;
};

connectoToDB();

const port = process.env.PORT || 8080;
const app = express();


app.use(cors());
app.use(express.json());

app.get("/endpoints", (req, res) => {
  res.send(listEndpoints(app))
});

// Seed the database
const Cup = mongoose.model('Cup', {
  year: Number,
  host: String,
  winner: String,
  second: String,
  third: String,
  fourth: String,
  goals_scored: Number,
  teams: Number,
  games: Number,
  attendance: Number
});

app.get("/", (req, res) => {
  const WorldCupApi = {
    Welcome: 'Hi! This a World Cup Api (1930 - 2018)',
    Routes: [{
      "/cups": 'Get all world cup.',
      "/cups/'number'": 'Get World Champion with Matching Database ID.',
      "/cups/winner/'country'": 'Get the result of a World Champion',
      "/cups/year/:year": 'Get the place where the World Cup was played according to the year',
      "/endpoints": "Get API endpoints."
    }]
  }
  res.send(WorldCupApi)
});

app.get("/cups", async (req, res) => {
  let query = req.query || {}
  try {
    let cups = await Cup.find(query)
    res.json(cups)
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

app.get("/cups/:_id", async (req, res) => {
  try {
    const cupId = await Cup.findById(req.params._id)
    if (cupId) {
      res.json(cupId)
    } else {
      res.status(404).json({ error: "Id not found" })
    }
  } catch (error) {
    res.status(400).json({ error: "Invalid Id" })
  }
});

app.get("/cups/winner/:winner", async (req, res) => {
  const { winner } = req.params
  try {
    const winnerCup = await Cup.find({ winner: { $regex: new RegExp("^" + winner, "i") } })
    if (winnerCup) {
      res.json(winnerCup)
    } else {
      res.status(404).json({ error: 'Winner not found' })
    }
  } catch (error) {
    res.status(400).json({ error: 'Error' })
  }
});

app.get("/cups/year/:year", async (req, res) => {
  const { year } = req.params
  try {
    const yearCup = await Cup.find( {year: year} )
  if (yearCup) {
    res.json(yearCup)
  } else {
    res.status(404).json({ error: 'Year not found' })
  }
} catch (error) {
  res.status(400).json({ error: 'Error' })
}
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
