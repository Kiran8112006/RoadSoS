const express =
  require("express");

const router =
  express.Router();

const {
  db,
} = require(
  "../firebaseAdmin"
);

router.post(
  "/acknowledge",
  async (req, res) => {

    try {

      const {
        alertId,
      } = req.body;

      if (!alertId) {

        return res
          .status(400)
          .json({
            error:
              "alertId is required",
          });

      }

      await db
        .collection(
          "emergencyAlerts"
        )
        .doc(alertId)
        .update({

          acknowledged:
            true,

        });

      return res.json({

        success:
          true,

      });

    }

    catch(error) {

      return res
        .status(500)
        .json({

          error:
            error.message,

        });

    }

  }
);

module.exports =
  router;
