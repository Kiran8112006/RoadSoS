import os
import sys
import json
import joblib
import pandas as pd

# Direct startup logs to stderr
print("Loading model...", file=sys.stderr)
sys.stderr.flush()

# Determine paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "ml-models", "driving_behavior_model.pkl"))

if not os.path.exists(MODEL_PATH):
    print(f"Error: Model file does not exist at {MODEL_PATH}", file=sys.stderr)
    sys.stderr.flush()
    sys.exit(1)

try:
    model = joblib.load(MODEL_PATH)
    # Output startup log strictly to stderr
    print("Driving Behavior ML Model Loaded", file=sys.stderr)
    sys.stderr.flush()
except Exception as e:
    print(f"Error loading model: {e}", file=sys.stderr)
    sys.stderr.flush()
    sys.exit(1)

feature_names = [
    'mean_speed', 'max_speed', 'min_speed', 'speed_std', 'speed_range',
    'mean_accel_mag', 'max_accel_mag', 'min_accel_mag', 'std_accel_mag', 'accel_range',
    'mean_roll', 'std_roll', 'roll_range',
    'mean_pitch', 'std_pitch', 'pitch_range',
    'mean_yaw', 'std_yaw', 'yaw_range'
]

def process_request(line):
    try:
        data = json.loads(line)
        if not data or "features" not in data:
            return {"error": True, "message": "Missing 'features' in request JSON"}
        
        features = data["features"]
        if not isinstance(features, list):
            return {"error": True, "message": "'features' must be a list"}
        
        if len(features) != 19:
            return {"error": True, "message": f"Expected exactly 19 features, got {len(features)}"}
        
        # Verify all elements are numeric
        for idx, val in enumerate(features):
            if not isinstance(val, (int, float)):
                return {"error": True, "message": f"Feature at index {idx} is not numeric: {val}"}
        
        # Convert to float
        features = [float(x) for x in features]

        # Predict using DataFrame to avoid scikit-learn warnings
        df = pd.DataFrame([features], columns=feature_names)
        
        pred = int(model.predict(df)[0])
        proba = model.predict_proba(df)[0]
        confidence = float(proba[pred])

        return {
            "prediction": pred,
            "confidence": confidence
        }
    except Exception as e:
        return {
            "error": True,
            "message": str(e)
        }

def main():
    # Loop infinitely reading from stdin
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        
        result = process_request(line)
        
        # Output exactly one JSON line per request to stdout
        print(json.dumps(result))
        sys.stdout.flush()

if __name__ == "__main__":
    main()
