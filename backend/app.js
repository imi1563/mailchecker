const express = require("express");
const bodyParser = require("body-parser");
const emailRouter = require("./routes/emailRoutes");
const mongoose = require("mongoose");
const userRouter = require("./routes/userRoutes");
const cors = require("cors");

require("dotenv").config();
const app = express();

const mongoConnection = async (params) => {
  try {
    const connectionDB = await mongoose.connect(
      `mongodb+srv://hamzabinsajid86:2HWCWbfywulMFLpy@cluster0.7he96x1.mongodb.net/?retryWrites=true&w=majority`
    );
    if (connectionDB) {
      console.log("Mongoose Connected");
    }
  } catch (error) {
    console.log("Mongoose Error", error);
  }
};
mongoConnection();
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "http://143.42.205.96");
//   //res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, DELETE,PATCH "
//   );
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   next();
// });
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.use("/emails", emailRouter);
app.use("/api/user", userRouter);

const port = process.env.PORT || 2022;
app.listen(port, () => {
  console.log(`listening on port http://localhost:${port}`);
});
