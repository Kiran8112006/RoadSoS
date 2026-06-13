import os
import pandas as pd
import numpy as np

ROOT = r"C:\Users\Admin\Downloads\UAH-DRIVESET-v1"

WINDOW_SIZE = 200
STEP = 100

rows = []

for driver in os.listdir(ROOT):

    driver_path = os.path.join(ROOT, driver)

    if not os.path.isdir(driver_path):
        continue

    if driver == "uah_driveset_reader":
        continue

    print(f"Processing {driver}")

    for trip in os.listdir(driver_path):

        trip_path = os.path.join(driver_path, trip)

        if not os.path.isdir(trip_path):
            continue

        # --------------------------
        # LABEL ASSIGNMENT
        # --------------------------

        label = None

        if "NORMAL" in trip.upper():
            label = 0

        elif "AGGRESSIVE" in trip.upper():
            label = 1

        else:
            # Ignore DROWSY trips
            continue

        accel_file = os.path.join(
            trip_path,
            "RAW_ACCELEROMETERS.txt"
        )

        gps_file = os.path.join(
            trip_path,
            "RAW_GPS.txt"
        )

        if not os.path.exists(accel_file):
            continue

        if not os.path.exists(gps_file):
            continue

        try:

            accel = pd.read_csv(
                accel_file,
                sep=r"\s+",
                header=None
            )

            gps = pd.read_csv(
                gps_file,
                sep=r"\s+",
                header=None
            )

            min_len = min(
                len(accel),
                len(gps)
            )

            accel = accel.iloc[:min_len]
            gps = gps.iloc[:min_len]

            for start in range(
                0,
                min_len - WINDOW_SIZE,
                STEP
            ):

                end = start + WINDOW_SIZE

                accel_window = accel.iloc[start:end]
                gps_window = gps.iloc[start:end]

                accel_x = accel_window[2]
                accel_y = accel_window[3]
                accel_z = accel_window[4]

                roll = accel_window[8]
                pitch = accel_window[9]
                yaw = accel_window[10]

                speed = gps_window[1]

                accel_mag = np.sqrt(
                    accel_x**2 +
                    accel_y**2 +
                    accel_z**2
                )

                row = {

                    # SPEED FEATURES

                    "mean_speed":
                        speed.mean(),

                    "max_speed":
                        speed.max(),

                    "min_speed":
                        speed.min(),

                    "speed_std":
                        speed.std(),

                    "speed_range":
                        speed.max() - speed.min(),

                    "speed_q25":
                        np.percentile(speed, 25),

                    "speed_q50":
                        np.percentile(speed, 50),

                    "speed_q75":
                        np.percentile(speed, 75),

                    # ACCEL FEATURES

                    "mean_accel_mag":
                        accel_mag.mean(),

                    "max_accel_mag":
                        accel_mag.max(),

                    "min_accel_mag":
                        accel_mag.min(),

                    "std_accel_mag":
                        accel_mag.std(),

                    "accel_range":
                        accel_mag.max() -
                        accel_mag.min(),

                    "accel_q25":
                        np.percentile(
                            accel_mag,
                            25
                        ),

                    "accel_q50":
                        np.percentile(
                            accel_mag,
                            50
                        ),

                    "accel_q75":
                        np.percentile(
                            accel_mag,
                            75
                        ),

                    # ROLL

                    "mean_roll":
                        roll.mean(),

                    "std_roll":
                        roll.std(),

                    "roll_range":
                        roll.max() -
                        roll.min(),

                    # PITCH

                    "mean_pitch":
                        pitch.mean(),

                    "std_pitch":
                        pitch.std(),

                    "pitch_range":
                        pitch.max() -
                        pitch.min(),

                    # YAW

                    "mean_yaw":
                        yaw.mean(),

                    "std_yaw":
                        yaw.std(),

                    "yaw_range":
                        yaw.max() -
                        yaw.min(),

                    # LABEL

                    "label":
                        label
                }

                rows.append(row)

        except Exception as e:

            print(
                f"Failed on {trip}"
            )

            print(e)

dataset = pd.DataFrame(rows)

dataset.to_csv(
    "dataset.csv",
    index=False
)

print("\nDataset Created")
print(dataset.shape)

print("\nClass Distribution")
print(
    dataset["label"]
    .value_counts()
)