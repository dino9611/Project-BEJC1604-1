const multer = require("multer");
const fs = require("fs");

const uploader = (destination, filenamePrefix) => {
  let defaultPath = "./public";

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      console.log(file);
      const dir = defaultPath + destination;
      console.log(dir);
      if (fs.existsSync(dir)) {
        console.log(dir, "exists");
        cb(null, dir);
      } else {
        fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
        console.log(dir, "make");
      }
    },

    filename: function (req, file, cb) {
      let originalname = file.originalname;
      let ext = originalname.split(".");
      let filename = filenamePrefix + Date.now() + "." + ext[ext.length - 1];
      cb(null, filename);
    },
  });

  const imageFilter = (req, file, callback) => {
    const ext = /\.(jpg|jpeg|png|gif|pdf|doc|docx|xlsx)$/;
    if (!file.originalname.match(ext)) {
      return callback(new Error("Only selected file type are allowed"), false);
    }
    callback(null, true);
  };

  return multer({
    storage: storage,
    fileFilter: imageFilter,
  });
};

module.exports = uploader;
