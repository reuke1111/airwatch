import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi.testclient import TestClient
from main import app, _get_recommendation


class TestForecastEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_recommendation_helper(self):
        self.assertEqual(
            _get_recommendation(0),
            "Air quality is Good. Safe for outdoor activities.",
        )
        self.assertEqual(
            _get_recommendation(50),
            "Air quality is Good. Safe for outdoor activities.",
        )
        self.assertEqual(
            _get_recommendation(51),
            "Air quality is Moderate. Sensitive groups should limit outdoor exposure.",
        )
        self.assertEqual(
            _get_recommendation(100),
            "Air quality is Moderate. Sensitive groups should limit outdoor exposure.",
        )
        self.assertEqual(
            _get_recommendation(101),
            "Air quality is Unhealthy for Sensitive Groups. Wear a mask outdoors.",
        )
        self.assertEqual(
            _get_recommendation(150),
            "Air quality is Unhealthy for Sensitive Groups. Wear a mask outdoors.",
        )
        self.assertEqual(
            _get_recommendation(151),
            "Air quality is Unhealthy. Avoid prolonged outdoor activities.",
        )
        self.assertEqual(
            _get_recommendation(300),
            "Air quality is Unhealthy. Avoid prolonged outdoor activities.",
        )

    def test_all_city_slugs(self):
        cities = [
            ("Delhi", "Delhi"),
            ("delhi", "Delhi"),
            ("Mumbai", "Mumbai"),
            ("mumbai", "Mumbai"),
            ("Beijing", "Beijing"),
            ("beijing", "Beijing"),
            ("Shanghai", "Shanghai"),
            ("shanghai", "Shanghai"),
            ("Moscow", "Moscow"),
            ("moscow", "Moscow"),
            ("Sao Paulo", "Sao Paulo"),
            ("sao_paulo", "Sao Paulo"),
            ("sao-paulo", "Sao Paulo"),
            ("Cairo", "Cairo"),
            ("cairo", "Cairo"),
            ("Johannesburg", "Johannesburg"),
            ("johannesburg", "Johannesburg"),
        ]

        for query, expected_city in cities:
            with self.subTest(query=query):
                response = self.client.get(f"/api/forecast/{query}")
                self.assertEqual(response.status_code, 200)
                data = response.json()

                self.assertEqual(data["city"], expected_city)
                self.assertIsInstance(data["current_aqi"], int)
                self.assertIsInstance(data["predicted_aqi"], int)
                self.assertIsInstance(data["mae"], float)
                self.assertIsInstance(data["shap_features"], list)
                self.assertIsInstance(data["shap_values"], list)
                self.assertIsInstance(data["recommendation"], str)

                # Verify shap_features and shap_values consistency
                self.assertGreater(len(data["shap_features"]), 0)
                self.assertEqual(len(data["shap_features"]), len(data["shap_values"]))
                for feat in data["shap_features"]:
                    self.assertIsInstance(feat, str)
                for val in data["shap_values"]:
                    self.assertIsInstance(val, float)

                # Verify recommendation matches predicted_aqi
                self.assertEqual(data["recommendation"], _get_recommendation(data["predicted_aqi"]))

    def test_city_not_found(self):
        unknown_cities = ["Atlantis", "tokyo", "unknown_city", "123"]
        for city in unknown_cities:
            with self.subTest(city=city):
                response = self.client.get(f"/api/forecast/{city}")
                self.assertEqual(response.status_code, 404)
                data = response.json()
                self.assertIn("detail", data)


if __name__ == "__main__":
    unittest.main()
