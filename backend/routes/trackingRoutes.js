const express = require('express');

const router = express.Router();

router.post(
  '/location',
  async (req, res) => {

    try {

      const {
        userId,
        latitude,
        longitude,
        speed,
        vehicleType,
        timestamp,
      } = req.body;

      console.log({
        userId,
        latitude,
        longitude,
        speed,
        vehicleType,
        timestamp,
      });

      return res.status(200).json({
        success: true,
        message:
          'Location received',
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        success: false,
        error: error.message,
      });

    }

  }
);

module.exports = router;