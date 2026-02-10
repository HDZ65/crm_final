from __future__ import annotations

import pickle
from pathlib import Path
from typing import Dict, Tuple

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split


NUMERIC_FEATURES = [
    "prev_rejects",
    "contract_age_months",
    "payment_history_count",
    "amount_cents",
    "preferred_debit_day",
]

CATEGORICAL_FEATURES = [
    "channel",
    "lot_code",
    "provider",
]

FEATURE_ORDER = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def sigmoid(value: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-value))


def generate_synthetic_data(
    sample_count: int = 1000,
    random_seed: int = 42,
) -> Tuple[Dict[str, np.ndarray], np.ndarray]:
    rng = np.random.default_rng(random_seed)

    channels = np.array(["WEB", "PHONE", "AGENCY", "MOBILE"])
    lots = np.array(["LOT_A", "LOT_B", "LOT_C", "LOT_D"])
    providers = np.array(["SLIMPAY", "GOCARDLESS", "MULTISAFEPAY", "EMERCHANTPAY"])

    features: Dict[str, np.ndarray] = {
        "prev_rejects": np.clip(rng.poisson(lam=0.8, size=sample_count), 0, 8),
        "contract_age_months": rng.integers(1, 121, size=sample_count),
        "payment_history_count": rng.integers(0, 61, size=sample_count),
        "amount_cents": np.clip(
            rng.normal(loc=9500, scale=6500, size=sample_count).astype(int),
            500,
            180_000,
        ),
        "preferred_debit_day": rng.integers(1, 29, size=sample_count),
        "channel": rng.choice(channels, size=sample_count, p=[0.45, 0.2, 0.15, 0.2]),
        "lot_code": rng.choice(lots, size=sample_count, p=[0.35, 0.3, 0.2, 0.15]),
        "provider": rng.choice(
            providers,
            size=sample_count,
            p=[0.35, 0.35, 0.2, 0.1],
        ),
    }

    channel_risk = {
        "WEB": 0.05,
        "PHONE": 0.18,
        "AGENCY": -0.08,
        "MOBILE": 0.1,
    }
    lot_risk = {
        "LOT_A": -0.08,
        "LOT_B": 0.05,
        "LOT_C": 0.16,
        "LOT_D": 0.22,
    }
    provider_risk = {
        "SLIMPAY": -0.04,
        "GOCARDLESS": -0.02,
        "MULTISAFEPAY": 0.08,
        "EMERCHANTPAY": 0.11,
    }

    contract_age_component = np.where(
        features["contract_age_months"] < 6,
        0.9,
        np.where(features["contract_age_months"] > 36, -0.35, 0.0),
    )

    debit_day_component = np.where(
        np.isin(features["preferred_debit_day"], [1, 2, 3, 28]),
        0.15,
        np.where(np.isin(features["preferred_debit_day"], [10, 15, 20]), -0.08, 0.0),
    )

    linear_risk = (
        -2.8
        + 0.48 * features["prev_rejects"]
        + contract_age_component
        - 0.025 * np.minimum(features["payment_history_count"], 24)
        + 0.000035 * features["amount_cents"]
        + debit_day_component
        + np.array([channel_risk[channel] for channel in features["channel"]])
        + np.array([lot_risk[lot] for lot in features["lot_code"]])
        + np.array([provider_risk[provider] for provider in features["provider"]])
    )

    probabilities = sigmoid(linear_risk)
    targets = rng.binomial(1, probabilities)
    return features, targets


def prepare_training_matrix(
    raw_features: Dict[str, np.ndarray],
) -> Tuple[np.ndarray, Dict[str, Dict[str, float]]]:
    stats = {
        "category_maps": {},
        "numeric_means": {},
        "numeric_stds": {},
    }

    transformed_columns = []

    for feature_name in FEATURE_ORDER:
        values = raw_features[feature_name]

        if feature_name in NUMERIC_FEATURES:
            values_as_float = values.astype(float)
            mean = float(np.mean(values_as_float))
            std = float(np.std(values_as_float))
            if std == 0:
                std = 1.0

            stats["numeric_means"][feature_name] = mean
            stats["numeric_stds"][feature_name] = std
            transformed_columns.append((values_as_float - mean) / std)
            continue

        unique_values = sorted({str(value).strip().upper() for value in values})
        category_map = {value: index for index, value in enumerate(unique_values)}
        category_map["_OTHER"] = len(category_map)

        stats["category_maps"][feature_name] = category_map
        transformed_columns.append(
            np.array(
                [
                    category_map.get(str(value).strip().upper(), category_map["_OTHER"])
                    for value in values
                ],
                dtype=float,
            )
        )

    matrix = np.column_stack(transformed_columns)
    return matrix, stats


def main() -> None:
    raw_features, targets = generate_synthetic_data(sample_count=1000)
    feature_matrix, stats = prepare_training_matrix(raw_features)

    X_train, X_test, y_train, y_test = train_test_split(
        feature_matrix,
        targets,
        test_size=0.2,
        random_state=42,
        stratify=targets,
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=4,
        class_weight="balanced_subsample",
        random_state=42,
    )
    model.fit(X_train, y_train)

    test_predictions = model.predict(X_test)
    test_probabilities = model.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, test_predictions)
    roc_auc = roc_auc_score(y_test, test_probabilities)

    artifact = {
        "model": model,
        "feature_order": FEATURE_ORDER,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "category_maps": stats["category_maps"],
        "numeric_means": stats["numeric_means"],
        "numeric_stds": stats["numeric_stds"],
    }

    output_path = Path(__file__).resolve().parent / "model.pkl"
    with output_path.open("wb") as model_file:
        pickle.dump(artifact, model_file)

    print(f"Model trained and saved to {output_path}")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"ROC-AUC: {roc_auc:.4f}")


if __name__ == "__main__":
    main()
