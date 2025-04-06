const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config(); // This loads the .env file



const customerRoutes = require("./routes/customer");
const paymentsRoutes = require("./routes/payments");
const financeRoutes = require("./routes/finance");
const eventmanagerRoutes = require("./routes/eventmanager");
const serviceRoutes = require("./routes/service");
const servicemanagerRoutes = require("./routes/servicemanager");
const dealersRoutes = require("./routes/dealers");
const storekeeperRoutes = require("./routes/storekeeper");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Routes
app.use("/customer", customerRoutes);
app.use("/payments", paymentsRoutes);
app.use("/finance", financeRoutes);
app.use("/eventmanager", eventmanagerRoutes);
app.use("/service", serviceRoutes);
app.use("/servicemanager", servicemanagerRoutes);
app.use("/dealers", dealersRoutes);
app.use("/storekeeper", storekeeperRoutes);
// Server setup
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
