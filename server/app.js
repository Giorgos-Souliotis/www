const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const path = require("path");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,   
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306  
});

console.log("Worked ok!);

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
    return;
  }
});

// Static Files Middleware
app.use(express.static(path.join(__dirname, "../public")));

// Global State
let loggedInUser = null;

// Helper Function: Authenticate Admin Middleware
function authenticateAdmin(req, res, next) {
  if (!loggedInUser || loggedInUser.role !== "admin") {
    return res.status(403).json({ message: "Forbidden. Admin access only." });
  }
  next();
}

// Routes
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(query, [username, hashedPassword], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Username already exists" });
      }
      return res.status(500).json({ message: "Database error" });
    }
    res.status(201).json({ message: "User registered successfully" });
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = results[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    loggedInUser = { id: user.id, username: user.username, role: user.role };
    res.json({
      message: "Login successful",
      username: user.username,
      role: user.role,
    });
  });
});

app.post("/api/logout", (req, res) => {
  loggedInUser = null;
  res.json({ message: "Logout successful" });
});

// File Path for Exhibitions
const exhibitionsFile = path.join(__dirname, "../data/exhibitions.json");

// Ensure exhibitions.json exists
if (!fs.existsSync(exhibitionsFile)) {
  fs.writeFileSync(exhibitionsFile, JSON.stringify([], null, 2));
}

// Helper Functions for Exhibitions
function readExhibitions() {
  const data = fs.readFileSync(exhibitionsFile);
  return JSON.parse(data);
}

function writeExhibitions(data) {
  fs.writeFileSync(exhibitionsFile, JSON.stringify(data, null, 2));
}

// Exhibition Routes
app.get("/api/exhibitions", authenticateAdmin, (req, res) => {
  const exhibitions = readExhibitions();
  res.json(exhibitions);
});

app.get("/api/exhibitions/public", (req, res) => {
  const exhibitions = readExhibitions();
  res.json(exhibitions);
});

// Create exhibition
app.post("/api/exhibitions", authenticateAdmin, (req, res) => {
  const { title, description, date } = req.body;

  if (!title || !description || !date) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const exhibitions = readExhibitions();
  const newExhibition = { id: Date.now(), title, description, date };
  exhibitions.push(newExhibition);
  writeExhibitions(exhibitions);

  res.status(201).json({
    message: "Exhibition added successfully",
    exhibition: newExhibition,
  });
});

// Update exhibition
app.put("/api/exhibitions/:id", authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { title, description, date } = req.body;

  const exhibitions = readExhibitions();
  const exhibitionIndex = exhibitions.findIndex((ex) => ex.id == id);

  if (exhibitionIndex === -1) {
    return res.status(404).json({ message: "Exhibition not found" });
  }

  exhibitions[exhibitionIndex] = {
    ...exhibitions[exhibitionIndex],
    title,
    description,
    date,
  };
  writeExhibitions(exhibitions);

  res.json({ message: "Exhibition updated successfully" });
});

// Delete exhibition
app.delete("/api/exhibitions/:id", authenticateAdmin, (req, res) => {
  const { id } = req.params;

  const exhibitions = readExhibitions();
  const updatedExhibitions = exhibitions.filter((ex) => ex.id != id);

  if (exhibitions.length === updatedExhibitions.length) {
    return res.status(404).json({ message: "Exhibition not found" });
  }

  writeExhibitions(updatedExhibitions);
  res.json({ message: "Exhibition deleted successfully" });
});

app.get("/api/paintings", (req, res) => {
  const paintings = [
    {
      id: 1,
      title: "Sunset Bliss",
      category: "landscape",
      image: "/images/sunset.jpg",
    },
    {
      id: 2,
      title: "The Thinker",
      category: "portrait",
      image: "/images/thinker.jpg",
    },
    {
      id: 3,
      title: "Abstract Dreams",
      category: "abstract",
      image: "/images/abstract.jpg",
    },
    {
      id: 4,
      title: "Mountain View",
      category: "landscape",
      image: "/images/mountain.jpg",
    },
  ];

  res.json(paintings);
});

app.get("/api/biography", (req, res) => {
  const biography = {
    title: "Biography of Leonardo da Vinci",
    content: `
    Biography of Leonardo da Vinci
Full Name: Leonardo di ser Piero da Vinci
Birth: April 15, 1452, in Vinci, Republic of Florence (now Italy)
Death: May 2, 1519, in Amboise, Kingdom of France
Profession: Painter, sculptor, architect, inventor, scientist, engineer, anatomist, musician, writer

Early Life
Leonardo da Vinci was born out of wedlock to Piero Fruosino di Antonio da Vinci, a notary, and Caterina, a peasant woman. Raised in his father's household, he received an informal education in Latin, geometry, and mathematics. His artistic talents became evident at an early age, leading to an apprenticeship under the renowned artist Andrea del Verrocchio in Florence.

Artistic Contributions
Leonardo is celebrated as one of the greatest painters in history, blending realism with imaginative and symbolic elements. His most famous works include:

Mona Lisa (1503-1506): Known for its enigmatic expression and pioneering use of sfumato (a technique for soft transitions between colors and tones).
The Last Supper (1495–1498): A monumental depiction of Jesus and his disciples, celebrated for its perspective and emotional intensity.
Vitruvian Man (c. 1490): A drawing that explores human proportion and its relation to geometry, symbolizing the blend of art and science.
Many of his works remained unfinished due to his insatiable curiosity and constant experimentation.

Scientific and Technological Achievements
Leonardo’s notebooks, filled with sketches and observations, reveal his genius in a wide range of disciplines. Highlights include:

Anatomy: His detailed studies of the human body, including muscles, organs, and bones, contributed to the understanding of human physiology.
Engineering: He designed war machines, flying devices, and hydraulic systems, many of which were centuries ahead of their time.
Natural Sciences: Leonardo studied the behavior of water, plants, and the movement of air, demonstrating a profound understanding of the natural world.
His notebooks, written in mirror script, were not widely understood during his lifetime but have since become a treasure trove of insight into Renaissance science and art.

Later Life
In 1516, Leonardo moved to France at the invitation of King Francis I, where he was given the title of "Premier Painter and Engineer and Architect of the King." He spent his final years in the Château du Clos Lucé near the royal château of Amboise, continuing his studies and refining his inventions.

Legacy
Leonardo da Vinci epitomizes the Renaissance ideal of a "universal genius" or "Renaissance man," excelling in multiple fields of human endeavor. His works remain iconic, blending artistic mastery with a profound understanding of science and the natural world. His legacy continues to inspire artists, scientists, and thinkers, symbolizing the boundless potential of human creativity and intellect.

Fun Facts
Leonardo was ambidextrous and often wrote with his left hand.
He was a vegetarian and an advocate for animal welfare.
Many of his inventions, such as the helicopter and tank, were conceptualized centuries before they became feasible.
Leonardo da Vinci’s life and works remain a testament to the limitless potential of human curiosity and imagination.
    `,
    image: "/images/artist.jpg",
  };

  res.json(biography);
});

app.get("/api/links", (req, res) => {
  const query = "SELECT category, name, url FROM links ORDER BY category, id";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching links:", err);
      return res.status(500).json({ message: "Error fetching links" });
    }

    // Group results by category
    const groupedLinks = results.reduce((acc, link) => {
      const { category, name, url } = link;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ name, url });
      return acc;
    }, {});

    // Transform grouped links into an array format
    const links = Object.keys(groupedLinks).map((category) => ({
      category,
      items: groupedLinks[category],
    }));

    // Extract unique categories
    const categories = Object.keys(groupedLinks);

    res.json({ links, categories });
  });
});

// Admin-only endpoint for managing links
app.get("/api/manage-links", authenticateAdmin, (req, res) => {
  const query = "SELECT * FROM links";
  db.query(query, (err, results) => {
      if (err) {
          return res.status(500).json({ message: "Database error", error: err });
      }
      res.json(results);
  });
});

// Get a specific link by ID
app.get("/api/links/:id", (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM links WHERE id = ?";
  db.query(query, [id], (err, results) => {
      if (err) {
          return res.status(500).json({ message: "Database error", error: err });
      }
      if (results.length === 0) {
          return res.status(404).json({ message: "Link not found" });
      }
      res.json(results[0]);
  });
});

// Create a new link
app.post("/api/links", (req, res) => {
  const { name, url, category } = req.body;
  if (!name || !url) {
      return res.status(400).json({ message: "Name and URL are required" });
  }
  const query = "INSERT INTO links (name, url, category) VALUES (?, ?, ?)";
  db.query(query, [name, url, category], (err, result) => {
      if (err) {
          return res.status(500).json({ message: "Database error", error: err });
      }
      res.status(201).json({ message: "Link created successfully", id: result.insertId });
  });
});

// Update a link
app.put("/api/links/:id", (req, res) => {
  const { id } = req.params;
  const { name, url, category } = req.body;
  const query = "UPDATE links SET name = ?, url = ?, category = ? WHERE id = ?";
  db.query(query, [name, url, category, id], (err, result) => {
      if (err) {
          return res.status(500).json({ message: "Database error", error: err });
      }
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Link not found" });
      }
      res.json({ message: "Link updated successfully" });
  });
});

// Delete a link
app.delete("/api/links/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM links WHERE id = ?";
  db.query(query, [id], (err, result) => {
      if (err) {
          return res.status(500).json({ message: "Database error", error: err });
      }
      if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Link not found" });
      }
      res.json({ message: "Link deleted successfully" });
  });
});

// Start the Server
app.listen(PORT, () => {});
