from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np


LOW_THRESHOLD = 40
HIGH_THRESHOLD = 70


class RiskScoringModel:
    def __init__(self, model_path: str = "model.pkl") -> None:
        self.model_path = Path(__file__).resolve().parent / model_path
        self._artifact = self._load_artifact()
        self._model = self._artifact["model"]
        self._feature_order: List[str] = self._artifact["feature_order"]
        self._numeric_features: List[str] = self._artifact["numeric_features"]
        self._categorical_features: List[str] = self._artifact["categorical_features"]
        self._category_maps: Dict[str, Dict[str, int]] = self._artifact["category_maps"]
        self._numeric_means: Dict[str, float] = self._artifact["numeric_means"]
        self._numeric_stds: Dict[str, float] = self._artifact["numeric_stds"]

    def _load_artifact(self) -> Dict[str, Any]:
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model file not found: {self.model_path}")

        with self.model_path.open("rb") as model_file:
            return pickle.load(model_file)

    def _normalize_numeric(self, feature_name: str, value: Any) -> float:
        number_value = float(value)
        mean = self._numeric_means[feature_name]
        std = self._numeric_stds[feature_name]
        if std == 0:
            return 0.0
        return (number_value - mean) / std

    def _encode_categorical(self, feature_name: str, value: Any) -> float:
        normalized = str(value).strip().upper()
        category_map = self._category_maps[feature_name]
        default_value = category_map.get("_OTHER", 0)
        return float(category_map.get(normalized, default_value))

    def _build_feature_vector(
        self,
        payload: Dict[str, Any],
    ) -> Tuple[np.ndarray, Dict[str, float]]:
        normalized_values: Dict[str, float] = {}
        feature_values: List[float] = []

        for feature_name in self._feature_order:
            value = payload[feature_name]
            if feature_name in self._numeric_features:
                normalized_value = self._normalize_numeric(feature_name, value)
            elif feature_name in self._categorical_features:
                normalized_value = self._encode_categorical(feature_name, value)
            else:
                normalized_value = float(value)

            normalized_values[feature_name] = normalized_value
            feature_values.append(normalized_value)

        return np.array([feature_values], dtype=float), normalized_values

    def _risk_tier_from_score(self, score: int) -> str:
        if score < LOW_THRESHOLD:
            return "LOW"
        if score <= HIGH_THRESHOLD:
            return "MEDIUM"
        return "HIGH"

    def _top_factors(
        self,
        normalized_values: Dict[str, float],
    ) -> Dict[str, float]:
        importances = getattr(self._model, "feature_importances_", None)

        if importances is None:
            return {}

        weighted_values: List[Tuple[str, float]] = []
        for index, feature_name in enumerate(self._feature_order):
            importance = float(importances[index])
            impact = abs(normalized_values[feature_name]) * importance
            weighted_values.append((feature_name, impact))

        total_impact = sum(value for _, value in weighted_values) or 1.0
        weighted_values.sort(key=lambda item: item[1], reverse=True)

        top = weighted_values[:3]
        return {
            feature_name: round((impact / total_impact) * 100.0, 2)
            for feature_name, impact in top
        }

    def predict(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        feature_vector, normalized_values = self._build_feature_vector(payload)
        probability = float(self._model.predict_proba(feature_vector)[0][1])
        score = int(round(probability * 100.0))
        risk_tier = self._risk_tier_from_score(score)
        factors = self._top_factors(normalized_values)

        return {
            "score": score,
            "risk_tier": risk_tier,
            "factors": factors,
        }
