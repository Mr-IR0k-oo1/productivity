//! Scrum helpers: issue keys, burndown and velocity. Mirrors `src/lib/scrum.ts`, which the
//! UI also uses.

use chrono::{DateTime, Duration, NaiveDate, TimeZone, Utc};
use serde::Serialize;

pub fn format_issue_key(prefix: &str, number: Option<i32>) -> Option<String> {
    number.filter(|n| *n != 0).map(|n| format!("{prefix}-{n}"))
}

/// `"orb-42"` → `("ORB", 42)`.
pub fn parse_issue_key(input: &str) -> Option<(String, i32)> {
    let upper = input.trim().to_uppercase();
    let (prefix, number) = upper.split_once('-')?;
    if !is_valid_issue_key_prefix(prefix) || number.is_empty() || !number.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    Some((prefix.to_owned(), number.parse().ok()?))
}

/// One capital letter, then up to nine capitals or digits.
pub fn is_valid_issue_key_prefix(prefix: &str) -> bool {
    let bytes = prefix.as_bytes();
    !bytes.is_empty()
        && bytes.len() <= 10
        && bytes[0].is_ascii_uppercase()
        && bytes[1..].iter().all(|b| b.is_ascii_uppercase() || b.is_ascii_digit())
}

pub fn sum_story_points(points: impl IntoIterator<Item = Option<i32>>) -> i64 {
    points.into_iter().map(|p| i64::from(p.unwrap_or(0))).sum()
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct BurndownPoint {
    pub date: String,
    pub ideal: f64,
    pub remaining: Option<i64>,
}

pub struct BurndownIssue {
    pub story_points: Option<i32>,
    pub completed_at: Option<DateTime<Utc>>,
}

fn start_of_utc_day(date: DateTime<Utc>) -> DateTime<Utc> {
    Utc.from_utc_datetime(&date.date_naive().and_hms_opt(0, 0, 0).expect("midnight is valid"))
}

fn round1(value: f64) -> f64 {
    // Math.round(x * 10) / 10 (JavaScript rounds .5 up).
    (value * 10.0 + 0.5).floor() / 10.0
}

/// One point per day from sprint start to end. `ideal` falls linearly from the committed
/// points to zero; `remaining` subtracts points completed by the end of each day and is
/// None for days that have not happened yet.
pub fn build_burndown(
    start: DateTime<Utc>,
    end: DateTime<Utc>,
    committed_points: i64,
    issues: &[BurndownIssue],
    now: DateTime<Utc>,
) -> Vec<BurndownPoint> {
    let first_day = start_of_utc_day(start);
    let last_day = start_of_utc_day(end);
    let day_count = ((last_day - first_day).num_milliseconds() as f64 / 86_400_000.0).round().max(1.0) as i64;
    let today = start_of_utc_day(now);

    (0..=day_count)
        .map(|day| {
            let date = first_day + Duration::days(day);
            let end_of_day = date + Duration::days(1);
            let completed = sum_story_points(
                issues.iter().filter(|i| i.completed_at.is_some_and(|at| at < end_of_day)).map(|i| i.story_points),
            );
            let ideal = committed_points as f64 * (1.0 - day as f64 / day_count as f64);
            BurndownPoint {
                date: date.format("%Y-%m-%d").to_string(),
                ideal: round1(ideal),
                remaining: if date > today { None } else { Some((committed_points - completed).max(0)) },
            }
        })
        .collect()
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct VelocitySprint {
    pub name: String,
    pub committed: i64,
    pub completed: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Velocity {
    pub sprints: Vec<VelocitySprint>,
    pub average: f64,
}

pub fn compute_velocity(completed: impl IntoIterator<Item = (String, Option<i32>, Option<i32>)>) -> Velocity {
    let sprints: Vec<VelocitySprint> = completed
        .into_iter()
        .map(|(name, committed, done)| VelocitySprint {
            name,
            committed: i64::from(committed.unwrap_or(0)),
            completed: i64::from(done.unwrap_or(0)),
        })
        .collect();
    let average = if sprints.is_empty() {
        0.0
    } else {
        round1(sprints.iter().map(|s| s.completed as f64).sum::<f64>() / sprints.len() as f64)
    };
    Velocity { sprints, average }
}

/// Parses `YYYY-MM-DD` (used in tests).
pub fn utc_date(value: &str) -> DateTime<Utc> {
    let date = NaiveDate::parse_from_str(value, "%Y-%m-%d").expect("valid date");
    Utc.from_utc_datetime(&date.and_hms_opt(0, 0, 0).expect("midnight is valid"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn issue_keys() {
        assert_eq!(format_issue_key("ORB", Some(42)), Some("ORB-42".into()));
        assert_eq!(format_issue_key("ORB", None), None);
        assert_eq!(format_issue_key("ORB", Some(0)), None);
        assert_eq!(parse_issue_key(" orb-42 "), Some(("ORB".into(), 42)));
        assert_eq!(parse_issue_key("ORB42"), None);
        assert_eq!(parse_issue_key("1RB-4"), None);
        assert_eq!(parse_issue_key("ORB-"), None);
        assert!(is_valid_issue_key_prefix("A1"));
        assert!(!is_valid_issue_key_prefix("ABCDEFGHIJK"));
        assert!(!is_valid_issue_key_prefix("ab"));
    }

    #[test]
    fn burndown_counts_down_and_stops_at_today() {
        let issues = [
            BurndownIssue { story_points: Some(3), completed_at: Some(utc_date("2026-01-02") + Duration::hours(10)) },
            BurndownIssue { story_points: Some(5), completed_at: None },
        ];
        let points = build_burndown(utc_date("2026-01-01"), utc_date("2026-01-05"), 8, &issues, utc_date("2026-01-03"));

        assert_eq!(points.len(), 5);
        assert_eq!(points[0], BurndownPoint { date: "2026-01-01".into(), ideal: 8.0, remaining: Some(8) });
        assert_eq!(points[1].remaining, Some(5));
        assert_eq!(points[2].remaining, Some(5));
        assert_eq!(points[3].remaining, None);
        assert_eq!(points[4].ideal, 0.0);
        assert_eq!(points[1].ideal, 6.0);
    }

    #[test]
    fn single_day_sprint_has_two_points() {
        let points = build_burndown(utc_date("2026-01-01"), utc_date("2026-01-01"), 4, &[], utc_date("2026-01-10"));
        assert_eq!(points.len(), 2);
    }

    #[test]
    fn velocity_averages_completed_points() {
        let velocity = compute_velocity(vec![("S1".into(), Some(10), Some(8)), ("S2".into(), None, Some(5))]);
        assert_eq!(velocity.average, 6.5);
        assert_eq!(velocity.sprints[1].committed, 0);
        assert_eq!(compute_velocity(Vec::new()).average, 0.0);
    }
}
