export default function handler(req, res) {
  // Handle the GET request to /api/biography
  if (req.method === 'GET') {
    // You can send a response with data (e.g., biography content)
    res.status(200).json({ biography: "Eisai poutanas gios" });
  } else {
    // Handle any other HTTP methods, such as POST, PUT, etc.
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
