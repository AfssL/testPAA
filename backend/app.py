import json
import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from core.solver import solve
from core.validator import detect_cycle

app = Flask(__name__)
CORS(app)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "curriculum.json")


def load_curriculum():
    with open(DATA_PATH) as f:
        return json.load(f)


@app.route("/api/curriculum", methods=["GET"])
def get_curriculum():
    return jsonify(load_curriculum())


@app.route("/api/solve", methods=["POST"])
def solve_schedule():
    body = request.get_json(force=True, silent=True)
    if body is None:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    courses = body.get("courses")
    if not courses:
        courses = load_curriculum()

    for code, info in courses.items():
        if "name" not in info:
            return jsonify({"error": f"Course '{code}' is missing a 'name' field."}), 400
        if not isinstance(info.get("req", []), list):
            return jsonify({"error": f"'req' for '{code}' must be a list."}), 400

    cycles = detect_cycle(courses)
    if cycles:
        return jsonify({
            "error": "Circular dependency detected.",
            "cycles": [" -> ".join(c) for c in cycles],
        }), 422

    semesters = solve(courses)
    total_sks = sum(course.get("sks", 0) for sem in semesters for course in sem)

    return jsonify({
        "semesters": semesters,
        "total_semesters": len(semesters),
        "total_sks": total_sks,
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
