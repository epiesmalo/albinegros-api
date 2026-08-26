const express = require("express");
const multer = require("multer");
const crypto = require("crypto");

const { uploadFileToR2 } = require("../services/r2.service");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: "No se ha enviado ningún archivo",
      });
    }

    const extension =
      req.file.originalname.includes(".")
        ? req.file.originalname.split(".").pop().toLowerCase()
        : "bin";

    const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const key = `images/${filename}`;

    const url = await uploadFileToR2({
      buffer: req.file.buffer,
      key,
      contentType: req.file.mimetype,
    });

    return res.json({
      ok: true,
      key,
      url,
      originalName: req.file.originalname,
      size: req.file.size,
      contentType: req.file.mimetype,
    });
  } catch (error) {
    console.error("Error subiendo archivo a R2:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo subir el archivo",
    });
  }
});

module.exports = router;