const express = require("express");

const router = express.Router();

router.get(
  "/nearby",
  async (req, res) => {

    console.log(
      "HOSPITAL ROUTE HIT"
    );

    try {

      const {
        latitude,
        longitude,
      } = req.query;

      console.log(
        "HOSPITAL SEARCH:",
        latitude,
        longitude
      );

      if (
        latitude == null ||
        longitude == null
      ) {

        return res
          .status(400)
          .json({
            error:
              "latitude and longitude are required",
          });

      }

      const query = `
      [out:json][timeout:30];
      (
        nwr
          ["amenity"~"hospital|clinic|doctors"]
          (around:50000,${latitude},${longitude});
        nwr
          ["healthcare"]
          (around:50000,${latitude},${longitude});
      );
      out center tags;
      `;

      const response =
        await fetch(
          "https://overpass-api.de/api/interpreter",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },
            body:
              new URLSearchParams({
                data:
                  query,
              }),
          }
        );

      if (!response.ok) {

        const text =
          await response.text();

        console.log(
          "OVERPASS ERROR:",
          response.status,
          text
        );

        return res
          .status(response.status)
          .json({
            error:
              "Failed to fetch hospitals",
          });

      }

      const data =
        await response.json();

      console.log(
        "OVERPASS RESPONSE:",
        data.elements?.length
      );

      const elements =
        data.elements || [];

      const seen =
        new Set();

      const hospitals =
        elements
          .filter(
            (hospital) => {

              const amenity =
                hospital.tags?.amenity;

              const healthcare =
                hospital.tags?.healthcare;

              return (
                ["hospital", "clinic", "doctors"].includes(
                  amenity
                ) ||
                [
                  "hospital",
                  "clinic",
                  "doctor",
                  "doctors",
                  "centre",
                ].includes(
                  healthcare
                )
              );

            }
          )
          .map(
            (hospital) => {

              const lat =
                hospital.lat ||
                hospital.center?.lat;

              const lon =
                hospital.lon ||
                hospital.center?.lon;

              return {

              name:
                hospital.tags?.name ||
                  hospital.tags?.operator ||
                  "Unknown Hospital",

              latitude:
                  lat,

              longitude:
                  lon,

              phone:
                hospital.tags?.phone ||
                hospital.tags?.["contact:phone"] ||
                "",

              };

            }
          )
          .filter(
            (hospital) => {

              if (
                !hospital.latitude ||
                !hospital.longitude
              ) {
                return false;
              }

              const key =
                `${hospital.name}-${hospital.latitude}-${hospital.longitude}`;

              if (
                seen.has(key)
              ) {
                return false;
              }

              seen.add(key);

              return true;

            }
          );

      console.log(
        "HOSPITALS RETURNED:",
        hospitals.length
      );

      res.json(
        hospitals
      );

    }

    catch(error) {

      console.log(error);

      res.status(500).json({
        error:
          error.message,
      });

    }

  }
);

module.exports = router;
