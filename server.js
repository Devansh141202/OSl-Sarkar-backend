const express = require("express");
const app = express();
const { spawn } = require("child_process");
const Image = require("./Models/imageModel")
const path = require("path");

const pythonScriptPath = "./hello.py";
require("dotenv").config({ path: "./config/.env" });

const connectDatabase = require("./config/db");
app.use(express.json());
var cors = require("cors");
app.use(cors({ origin: true, credentials: true }));
const multer = require("multer");
connectDatabase();

app.use(express.urlencoded({ extended: true }));
const upload = multer({
  dest: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads/"));
  },
  limits: {
    fileSize: 30 * 1000000,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error("Invalid file type");
      error.code = "INVALID_FILE_TYPE";
      return cb(error, false);
    }
    
    cb(null, true);
  },
});
app.get("/get-image/:id", async(req, res)=>{
  const {id} = req.params
  const image = await Image.findById(id)
  if(!image){
    return res.status(400).send({message: "image not found!!"})
  }
  res.status(200).send({message: "image fetched!!",image});
})
app.post("/api/photos", upload.single("files"), (req, res) => {
  const pythonScriptArgs = [req.file.destination, req.file.filename];
  console.log("upload success!!");
  try {
    const pythonProcess = spawn("python", [
      pythonScriptPath,
      ...pythonScriptArgs,
    ]);
    let response = "";
    pythonProcess.stdout.on("data", (data) => {
      console.log(`Python script output: ${data}`);
      response += data;
    });
    
    pythonProcess.stderr.on("data", (data) => {
      console.error(`Error in Python script: ${data}`);
      return;
    });
    pythonProcess.on("close", async(code) => {
      if (code === 0) {
        const dbData = await Image.create({image:response})
        return res.status(200).send({ message: "Image inserted!!",dbData });
      } else {
        console.error(`Python script exited with code ${code}`);
        // return res.status(500).json({ error: "Internal server error" });
      }
    });
    
  } catch (error) {
    console.log(error);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server Listening on ${process.env.PORT}`);
});
