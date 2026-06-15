import pickle, json, os

paths = {
    "driving": "backend/ml-models/driving_behavior_model.pkl",
    "road": "backend/ml-models/road_surface_model.pkl",
}

result = {}
for key, path in paths.items():
    with open(path, "rb") as f:
        model = pickle.load(f)
    info = {
        "model_type": type(model).__name__,
        "num_features": getattr(model, "n_features_in_", getattr(model, "n_features_", None),),
        "feature_names": getattr(model, "feature_names_in_", None),
        "output_classes": getattr(model, "classes_", None),
    }
    result[key] = info

print(json.dumps(result, default=str, indent=2))
