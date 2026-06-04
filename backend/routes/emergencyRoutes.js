const express = require('express');

const router = express.Router();

router.post(
  '/trigger',
  async (req, res) => {

    try {

      console.log(
        'EMERGENCY ALERT'
      );

      console.log(
        req.body
      );

      res.json({

        success: true,

        message:
          'Emergency received',

      });

    }

    catch (error) {

      res.status(500).json({

        success: false,

        error:
          error.message,

      });

    }

  }
);

module.exports = router;