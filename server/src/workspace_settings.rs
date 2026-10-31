//! The workspace settings document (`workspace_settings.settings`). Mirrors the zod schema
//! the previous API used: every section has fixed fields with defaults, unknown fields are
//! dropped, and a value of the wrong type is an error.

use chrono::Utc;
use serde_json::{json, Map, Value};

use crate::task_metadata::iso;

pub const SECTIONS: [&str; 9] =
    ["general", "notifications", "tasks", "calendar", "reports", "integrations", "security", "appearance", "advanced"];

const DAYS: [&str; 7] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

#[derive(Clone, Copy)]
enum Kind {
    Bool,
    Text,
    /// A string of at least this many characters.
    TextMin(usize),
    NullableText,
    Choice(&'static [&'static str]),
    WorkingHours,
}

type Field = (&'static str, Kind);

fn fields(section: &str) -> &'static [Field] {
    use Kind::*;
    const CONNECTION: &[&str] = &["connected", "disconnected"];
    match section {
        "general" => &[
            ("workspaceName", TextMin(2)),
            ("workspaceDescription", Text),
            ("timezone", Text),
            ("dateFormat", Choice(&["12h", "24h"])),
            ("language", Choice(&["en", "ta", "hi"])),
            ("theme", Choice(&["dark", "light"])),
            ("workspaceLogoDataUrl", NullableText),
        ],
        "notifications" => &[
            ("taskAssigned", Bool),
            ("taskDueSoon", Bool),
            ("mentionedInComments", Bool),
            ("ideaConverted", Bool),
            ("weeklyDigest", Bool),
            ("inApp", Bool),
            ("push", Bool),
            ("slack", Bool),
            ("whatsapp", Bool),
        ],
        "tasks" => &[
            ("defaultTaskView", Choice(&["kanban", "list", "calendar"])),
            ("defaultPriorityLevels", Text),
            ("taskStatuses", Text),
            ("recurringTaskTemplates", Text),
            ("notifyWhenCompleted", Bool),
            ("notifyWhenOverdue", Bool),
            ("enableBillableHours", Bool),
            ("defaultEstimateUnit", Choice(&["hours", "days"])),
        ],
        "calendar" => &[
            ("workingHours", WorkingHours),
            ("weekendHidden", Bool),
            ("timeOffTypes", Text),
            ("googleCalendarSync", Bool),
            ("defaultEventDuration", Choice(&["30", "60"])),
        ],
        "reports" => &[
            ("defaultReportPeriod", Choice(&["weekly", "monthly"])),
            ("exportFormat", Text),
            ("showSensitiveData", Bool),
            ("dashboardWidgetPreferences", Text),
        ],
        "integrations" => &[
            ("googleCalendar", Choice(CONNECTION)),
            ("slack", Choice(CONNECTION)),
            ("googleDrive", Choice(CONNECTION)),
            ("zapier", Choice(CONNECTION)),
            ("whatsappBusiness", Choice(CONNECTION)),
        ],
        "security" => &[("twoFactorAuthentication", Bool)],
        "appearance" => &[
            ("workspaceColor", Text),
            ("sidebarDensity", Choice(&["compact", "normal"])),
            ("showActivityFeed", Bool),
            ("commandPaletteShortcuts", Text),
        ],
        "advanced" => &[("apiKey", Text), ("webhookUrl", Text), ("webhookSecret", Text), ("auditLog", Text)],
        _ => &[],
    }
}

pub fn defaults() -> Value {
    json!({
        "general": {
            "workspaceName": "My workspace",
            "workspaceDescription": "Execution stack for startup teams.",
            "timezone": "Asia/Kolkata",
            "dateFormat": "24h",
            "language": "en",
            "theme": "dark",
            "workspaceLogoDataUrl": null
        },
        "notifications": {
            "taskAssigned": true, "taskDueSoon": true, "mentionedInComments": true, "ideaConverted": true,
            "weeklyDigest": false, "inApp": true, "push": false, "slack": false, "whatsapp": false
        },
        "tasks": {
            "defaultTaskView": "kanban",
            "defaultPriorityLevels": "High, Medium, Low",
            "taskStatuses": "To Do, In Progress, Review, Done",
            "recurringTaskTemplates": "Daily Standup, Weekly Sprint Review",
            "notifyWhenCompleted": true,
            "notifyWhenOverdue": true,
            "enableBillableHours": true,
            "defaultEstimateUnit": "hours"
        },
        "calendar": {
            "workingHours": {
                "Mon": { "start": "09:00", "end": "18:00" },
                "Tue": { "start": "09:00", "end": "18:00" },
                "Wed": { "start": "09:00", "end": "18:00" },
                "Thu": { "start": "09:00", "end": "18:00" },
                "Fri": { "start": "09:00", "end": "18:00" },
                "Sat": { "start": "10:00", "end": "14:00" },
                "Sun": { "start": "10:00", "end": "14:00" }
            },
            "weekendHidden": true,
            "timeOffTypes": "Vacation, Sick, Personal",
            "googleCalendarSync": true,
            "defaultEventDuration": "60"
        },
        "reports": {
            "defaultReportPeriod": "weekly",
            "exportFormat": "PDF, Excel, CSV",
            "showSensitiveData": true,
            "dashboardWidgetPreferences": "Total Tasks, Active Ideas, Hours Tracked, Completion Rate"
        },
        "integrations": {
            "googleCalendar": "connected", "slack": "disconnected", "googleDrive": "disconnected",
            "zapier": "disconnected", "whatsappBusiness": "disconnected"
        },
        "security": { "twoFactorAuthentication": false },
        "appearance": {
            "workspaceColor": "#22c55e", "sidebarDensity": "normal", "showActivityFeed": true, "commandPaletteShortcuts": "Ctrl+K"
        },
        "advanced": {
            "apiKey": "pf_api_live_xxxxxxxxxxxxx",
            "webhookUrl": "https://hooks.example.com/orbit",
            "webhookSecret": "whsec_xxxxxx",
            "auditLog": "Arun changed role from Member to Manager\nBala updated webhook settings"
        }
    })
}

fn as_object(value: &Value) -> Map<String, Value> {
    value.as_object().cloned().unwrap_or_default()
}

fn check_working_day(day: &str, value: Option<&Value>, default: &Value) -> Result<Value, String> {
    let Some(value) = value else {
        return Err(format!("calendar.workingHours.{day} is required"));
    };
    let object = value.as_object().ok_or_else(|| format!("calendar.workingHours.{day} must be an object"))?;
    let mut out = Map::new();
    for key in ["start", "end"] {
        let field = match object.get(key) {
            None => default[key].clone(),
            Some(Value::String(text)) => Value::String(text.clone()),
            Some(_) => return Err(format!("calendar.workingHours.{day}.{key} must be a string")),
        };
        out.insert(key.to_owned(), field);
    }
    Ok(Value::Object(out))
}

/// Validates one section, filling missing fields with defaults (zod `.default()`).
pub fn parse_section(section: &str, value: &Value) -> Result<Value, String> {
    let object = value.as_object().ok_or_else(|| format!("{section} must be an object"))?;
    let section_defaults = &defaults()[section];
    let mut out = Map::new();

    for (name, kind) in fields(section) {
        let path = format!("{section}.{name}");
        let given = object.get(*name);
        let parsed = match (kind, given) {
            (Kind::WorkingHours, None) => section_defaults[*name].clone(),
            (Kind::WorkingHours, Some(hours)) => {
                let hours = hours.as_object().ok_or_else(|| format!("{path} must be an object"))?;
                let mut days = Map::new();
                for day in DAYS {
                    days.insert(day.to_owned(), check_working_day(day, hours.get(day), &section_defaults[*name][day])?);
                }
                Value::Object(days)
            }
            (_, None) => section_defaults[*name].clone(),
            (Kind::Bool, Some(Value::Bool(b))) => Value::Bool(*b),
            (Kind::Bool, Some(_)) => return Err(format!("{path} must be a boolean")),
            (Kind::Text, Some(Value::String(s))) => Value::String(s.clone()),
            (Kind::TextMin(min), Some(Value::String(s))) if s.chars().count() >= *min => Value::String(s.clone()),
            (Kind::TextMin(min), Some(_)) => return Err(format!("{path} must be a string of at least {min} characters")),
            (Kind::NullableText, Some(Value::Null)) => Value::Null,
            (Kind::NullableText, Some(Value::String(s))) => Value::String(s.clone()),
            (Kind::Choice(options), Some(Value::String(s))) if options.contains(&s.as_str()) => Value::String(s.clone()),
            (Kind::Choice(options), Some(_)) => return Err(format!("{path} must be one of: {}", options.join(", "))),
            (_, Some(_)) => return Err(format!("{path} must be a string")),
        };
        out.insert((*name).to_owned(), parsed);
    }

    Ok(Value::Object(out))
}

/// Validates a whole document.
pub fn parse(document: &Value) -> Result<Value, String> {
    let object = as_object(document);
    let mut out = Map::new();
    for section in SECTIONS {
        let value = object.get(section).ok_or_else(|| format!("{section} is required"))?;
        out.insert(section.to_owned(), parse_section(section, value)?);
    }
    Ok(Value::Object(out))
}

/// Stored settings merged over the defaults, with the workspace's real name.
pub fn normalize(raw: &Value, workspace_name: Option<&str>) -> Result<Value, String> {
    let source = as_object(raw);
    let defaults = defaults();
    let mut merged = Map::new();

    for section in SECTIONS {
        let mut values = as_object(&defaults[section]);
        values.extend(as_object(source.get(section).unwrap_or(&Value::Null)));
        if section == "general" {
            if let Some(name) = workspace_name.filter(|n| !n.is_empty()) {
                values.insert("workspaceName".into(), Value::String(name.to_owned()));
            }
        }
        if section == "calendar" {
            let mut hours = as_object(&defaults["calendar"]["workingHours"]);
            if let Some(stored) = source.get("calendar").and_then(|c| c.get("workingHours")) {
                hours.extend(as_object(stored));
            }
            values.insert("workingHours".into(), Value::Object(hours));
        }
        merged.insert(section.to_owned(), Value::Object(values));
    }

    parse(&Value::Object(merged))
}

/// Replaces one section's fields with `data` (already validated by [`parse_section`]).
pub fn update(current: &Value, section: &str, data: &Value, workspace_name: Option<&str>) -> Result<Value, String> {
    let mut next = as_object(current);
    let mut values = as_object(&current[section]);
    values.extend(as_object(data));
    if section == "general" {
        if let Some(name) = workspace_name.filter(|n| !n.is_empty()) {
            values.insert("workspaceName".into(), Value::String(name.to_owned()));
        }
    }
    next.insert(section.to_owned(), Value::Object(values));
    parse(&Value::Object(next))
}

/// Prepends a timestamped line to the audit log, keeping the newest 25.
pub fn append_audit_entry(settings: &Value, entry: &str) -> Result<Value, String> {
    let mut next = settings.clone();
    let log = settings["advanced"]["auditLog"].as_str().unwrap_or_default();
    let mut lines = vec![format!("[{}] {entry}", iso(Utc::now()))];
    lines.extend(log.split('\n').map(str::trim).filter(|line| !line.is_empty()).map(str::to_owned));
    lines.truncate(25);
    next["advanced"]["auditLog"] = Value::String(lines.join("\n"));
    parse(&next)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_settings_normalize_to_defaults_with_the_workspace_name() {
        let settings = normalize(&json!({}), Some("Acme")).unwrap();
        assert_eq!(settings["general"]["workspaceName"], json!("Acme"));
        assert_eq!(settings["calendar"]["workingHours"]["Sat"]["start"], json!("10:00"));
        assert_eq!(settings["security"]["twoFactorAuthentication"], json!(false));
    }

    #[test]
    fn unknown_fields_are_dropped_and_partial_hours_merged() {
        let settings = normalize(
            &json!({ "general": { "bogus": 1, "theme": "light" }, "calendar": { "workingHours": { "Mon": { "start": "08:00", "end": "16:00" } } } }),
            None,
        )
        .unwrap();
        assert!(settings["general"].get("bogus").is_none());
        assert_eq!(settings["general"]["theme"], json!("light"));
        assert_eq!(settings["calendar"]["workingHours"]["Mon"]["start"], json!("08:00"));
        assert_eq!(settings["calendar"]["workingHours"]["Tue"]["start"], json!("09:00"));
    }

    #[test]
    fn wrong_types_are_rejected() {
        assert!(parse_section("general", &json!({ "theme": "blue" })).is_err());
        assert!(parse_section("notifications", &json!({ "push": "yes" })).is_err());
        assert!(parse_section("general", &json!({ "workspaceName": "A" })).is_err());
        assert!(parse_section("calendar", &json!({ "workingHours": { "Mon": {} } })).is_err());
    }

    #[test]
    fn patch_data_is_completed_with_defaults() {
        let data = parse_section("security", &json!({})).unwrap();
        assert_eq!(data, json!({ "twoFactorAuthentication": false }));
    }

    #[test]
    fn audit_log_keeps_newest_25() {
        let mut settings = normalize(&json!({}), None).unwrap();
        for i in 0..30 {
            settings = append_audit_entry(&settings, &format!("entry {i}")).unwrap();
        }
        let log = settings["advanced"]["auditLog"].as_str().unwrap();
        assert_eq!(log.lines().count(), 25);
        assert!(log.lines().next().unwrap().ends_with("entry 29"));
    }
}
