//! The view metadata stored on each task (`tasks.metadata`). Mirrors
//! `types/task-view-metadata.ts`: unknown fields are dropped and bad values fall back.

use chrono::{DateTime, SecondsFormat, Utc};
use serde_json::{json, Map, Value};

/// JavaScript `toISOString()` format: `2026-10-31T09:00:00.000Z`.
pub fn iso(date: DateTime<Utc>) -> String {
    date.to_rfc3339_opts(SecondsFormat::Millis, true)
}

fn object(value: &Value) -> Map<String, Value> {
    value.as_object().cloned().unwrap_or_default()
}

/// `source.key ?? fallback.key` (null counts as missing).
fn pick<'a>(source: &'a Map<String, Value>, fallback: &'a Map<String, Value>, key: &str) -> Option<&'a Value> {
    source.get(key).filter(|v| !v.is_null()).or_else(|| fallback.get(key).filter(|v| !v.is_null()))
}

fn non_negative_integer(value: Option<&Value>, default: i64) -> i64 {
    let number = value.and_then(Value::as_f64).filter(|n| n.is_finite()).unwrap_or(default as f64);
    // Math.max(0, Math.round(n))
    (number + 0.5).floor().max(0.0) as i64
}

fn boolean(value: Option<&Value>, default: bool) -> bool {
    value.and_then(Value::as_bool).unwrap_or(default)
}

fn trimmed_string(value: Option<&Value>) -> Value {
    match value.and_then(Value::as_str).map(str::trim) {
        Some(text) if !text.is_empty() => Value::String(text.to_owned()),
        _ => Value::Null,
    }
}

fn labels(value: Option<&Value>) -> Vec<String> {
    let mut seen = Vec::<String>::new();
    for label in value.and_then(Value::as_array).into_iter().flatten() {
        if let Some(text) = label.as_str().map(str::trim) {
            if !text.is_empty() && !seen.iter().any(|existing| existing == text) {
                seen.push(text.to_owned());
            }
        }
    }
    seen
}

fn normalize_date(value: Option<&Value>, fallback: &str) -> String {
    value
        .and_then(Value::as_str)
        .and_then(|text| DateTime::parse_from_rfc3339(text).ok())
        .map(|date| iso(date.with_timezone(&Utc)))
        .unwrap_or_else(|| fallback.to_owned())
}

/// Normalizes stored or submitted metadata. `fallback` supplies values (typically
/// `startDate`) for fields the input doesn't have.
pub fn normalize(input: &Value, fallback: &Value) -> Value {
    let source = object(input);
    let fallback = object(fallback);
    let start_fallback = fallback.get("startDate").and_then(Value::as_str).map(str::to_owned).unwrap_or_else(|| iso(Utc::now()));

    let subtasks_total = non_negative_integer(pick(&source, &fallback, "subtasksTotal"), 0);
    let subtasks_done = non_negative_integer(pick(&source, &fallback, "subtasksDone"), 0).min(subtasks_total);

    json!({
        "labels": labels(pick(&source, &fallback, "labels")),
        "subtasksDone": subtasks_done,
        "subtasksTotal": subtasks_total,
        "comments": non_negative_integer(pick(&source, &fallback, "comments"), 0),
        "estimateHours": non_negative_integer(pick(&source, &fallback, "estimateHours"), 0),
        "progress": non_negative_integer(pick(&source, &fallback, "progress"), 0).min(100),
        "recurring": boolean(pick(&source, &fallback, "recurring"), false),
        "dependency": trimmed_string(pick(&source, &fallback, "dependency")),
        "startDate": normalize_date(pick(&source, &fallback, "startDate"), &start_fallback),
        "isMilestone": boolean(pick(&source, &fallback, "isMilestone"), false),
        "assigneeName": trimmed_string(pick(&source, &fallback, "assigneeName")),
    })
}

/// Applies a partial update on top of the current (normalized) metadata.
pub fn merge(current: &Value, patch: &Value, fallback: &Value) -> Value {
    let mut merged = object(&normalize(current, fallback));
    merged.extend(object(patch));
    normalize(&Value::Object(merged), fallback)
}

/// The fallback the API uses for a stored task: its creation (or due) date as `startDate`.
pub fn fallback_for(created_at: Option<DateTime<Utc>>, due_date: Option<DateTime<Utc>>) -> Value {
    json!({ "startDate": iso(created_at.or(due_date).unwrap_or_else(Utc::now)) })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fills_defaults_and_drops_unknown_fields() {
        let value = normalize(&json!({ "extra": 1 }), &json!({ "startDate": "2026-01-01T00:00:00.000Z" }));
        assert_eq!(value["labels"], json!([]));
        assert_eq!(value["progress"], json!(0));
        assert_eq!(value["startDate"], json!("2026-01-01T00:00:00.000Z"));
        assert!(value.get("extra").is_none());
        assert_eq!(value["dependency"], Value::Null);
    }

    #[test]
    fn clamps_and_cleans_values() {
        let value = normalize(
            &json!({
                "labels": [" a ", "a", "", 3, "b"],
                "subtasksTotal": 2,
                "subtasksDone": 5,
                "progress": 140.4,
                "estimateHours": -3,
                "assigneeName": "  ",
                "startDate": "2026-02-03T04:05:06+02:00",
                "recurring": "yes"
            }),
            &json!({}),
        );
        assert_eq!(value["labels"], json!(["a", "b"]));
        assert_eq!(value["subtasksDone"], json!(2));
        assert_eq!(value["progress"], json!(100));
        assert_eq!(value["estimateHours"], json!(0));
        assert_eq!(value["assigneeName"], Value::Null);
        assert_eq!(value["startDate"], json!("2026-02-03T02:05:06.000Z"));
        assert_eq!(value["recurring"], json!(false));
    }

    #[test]
    fn merge_keeps_existing_fields() {
        let fallback = json!({ "startDate": "2026-01-01T00:00:00.000Z" });
        let current = normalize(&json!({ "labels": ["x"], "progress": 30 }), &fallback);
        let merged = merge(&current, &json!({ "progress": 60 }), &fallback);
        assert_eq!(merged["labels"], json!(["x"]));
        assert_eq!(merged["progress"], json!(60));
    }
}
