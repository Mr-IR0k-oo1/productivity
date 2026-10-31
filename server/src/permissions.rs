//! What each workspace role may do. Mirrors `src/lib/permissions.ts`, which the UI uses to
//! hide actions a role can't take; keep the two in step.
//!
//!   viewer  read everything, change nothing
//!   member  create and edit work; delete only their own issues and ideas
//!   admin   + manage sprints, projects, workspace settings and members
//!   owner   + delete the workspace

use std::fmt;
use std::str::FromStr;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    Viewer,
    Member,
    Admin,
    Owner,
}

impl Role {
    pub fn as_str(self) -> &'static str {
        match self {
            Role::Viewer => "viewer",
            Role::Member => "member",
            Role::Admin => "admin",
            Role::Owner => "owner",
        }
    }

    pub fn is_privileged(self) -> bool {
        matches!(self, Role::Admin | Role::Owner)
    }
}

impl fmt::Display for Role {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl FromStr for Role {
    type Err = String;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value {
            "viewer" => Ok(Role::Viewer),
            "member" => Ok(Role::Member),
            "admin" => Ok(Role::Admin),
            "owner" => Ok(Role::Owner),
            other => Err(format!("unknown role {other:?}")),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Permission {
    Write,
    DeleteAnyIssue,
    ManageSprints,
    ManageProjects,
    ManageSettings,
    ManageMembers,
    DeleteWorkspace,
}

impl Permission {
    fn minimum_role(self) -> Role {
        match self {
            Permission::Write => Role::Member,
            Permission::DeleteAnyIssue
            | Permission::ManageSprints
            | Permission::ManageProjects
            | Permission::ManageSettings
            | Permission::ManageMembers => Role::Admin,
            Permission::DeleteWorkspace => Role::Owner,
        }
    }
}

pub fn can(role: Option<Role>, permission: Permission) -> bool {
    role.is_some_and(|role| role >= permission.minimum_role())
}

/// Members may delete what they created; admins and owners may delete anything.
pub fn can_delete_owned(role: Option<Role>, owner_user_id: Uuid, actor_user_id: Uuid) -> bool {
    can(role, Permission::DeleteAnyIssue) || (can(role, Permission::Write) && owner_user_id == actor_user_id)
}

pub fn is_read_method(method: &str) -> bool {
    matches!(method.to_ascii_uppercase().as_str(), "GET" | "HEAD" | "OPTIONS")
}

/// Writes a viewer may still make: they only touch the viewer's own state.
fn is_viewer_allowed_write(path: &str) -> bool {
    let under = |prefix: &str| path == prefix || path.starts_with(&format!("{prefix}/"));
    under("/api/notifications") || path.starts_with("/api/workspace/switch/") || under("/api/api-keys")
}

pub fn is_write_allowed_for_role(role: Role, method: &str, path: &str) -> bool {
    is_read_method(method) || can(Some(role), Permission::Write) || is_viewer_allowed_write(path)
}

/// People manage their own API keys; admins and owners can also revoke anyone's in the workspace.
pub fn can_manage_api_key(role: Option<Role>, key_owner_user_id: Uuid, actor_user_id: Uuid) -> bool {
    key_owner_user_id == actor_user_id || can(role, Permission::ManageMembers)
}

/// Viewers may only hold read keys; anyone who can write may choose either scope.
pub fn can_create_api_key_scope(role: Option<Role>, scope: &str) -> bool {
    if scope == "read" {
        role.is_some()
    } else {
        can(role, Permission::Write)
    }
}

// ---- Workspace membership rules (src/lib/workspace-access.ts) ----

pub fn can_manage_workspace_member(actor: Role) -> bool {
    actor.is_privileged()
}

pub fn can_add_workspace_member(actor: Role, requested: Role) -> bool {
    match actor {
        Role::Owner => true,
        Role::Admin => requested != Role::Owner,
        _ => false,
    }
}

pub fn can_update_workspace_member_role(actor: Role, target: Role, requested: Role) -> bool {
    if target == Role::Owner && requested != Role::Owner {
        return false;
    }
    match actor {
        Role::Owner => true,
        Role::Admin => requested != Role::Owner,
        _ => false,
    }
}

pub fn can_deactivate_workspace_member(actor: Role, target: Role, actor_user_id: Uuid, target_user_id: Uuid) -> bool {
    actor_user_id != target_user_id && target != Role::Owner && actor.is_privileged()
}

pub fn can_delete_workspace(actor: Role) -> bool {
    actor == Role::Owner
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ids() -> (Uuid, Uuid) {
        (Uuid::from_u128(1), Uuid::from_u128(2))
    }

    #[test]
    fn viewers_change_nothing() {
        assert!(!can(Some(Role::Viewer), Permission::Write));
        assert!(!can(Some(Role::Viewer), Permission::ManageSprints));
    }

    #[test]
    fn members_write_but_do_not_administer() {
        assert!(can(Some(Role::Member), Permission::Write));
        assert!(!can(Some(Role::Member), Permission::ManageSprints));
        assert!(!can(Some(Role::Member), Permission::ManageSettings));
        assert!(!can(Some(Role::Member), Permission::DeleteAnyIssue));
    }

    #[test]
    fn admins_administer_but_cannot_delete_the_workspace() {
        assert!(can(Some(Role::Admin), Permission::ManageMembers));
        assert!(can(Some(Role::Admin), Permission::ManageProjects));
        assert!(!can(Some(Role::Admin), Permission::DeleteWorkspace));
        assert!(can(Some(Role::Owner), Permission::DeleteWorkspace));
        assert!(!can(None, Permission::Write));
    }

    #[test]
    fn delete_owned() {
        let (u1, u2) = ids();
        assert!(can_delete_owned(Some(Role::Member), u1, u1));
        assert!(!can_delete_owned(Some(Role::Member), u1, u2));
        assert!(can_delete_owned(Some(Role::Admin), u1, u2));
        assert!(!can_delete_owned(Some(Role::Viewer), u1, u1));
    }

    #[test]
    fn write_rules_by_path() {
        assert!(is_write_allowed_for_role(Role::Viewer, "GET", "/api/tasks"));
        assert!(!is_write_allowed_for_role(Role::Viewer, "POST", "/api/tasks"));
        assert!(!is_write_allowed_for_role(Role::Viewer, "PATCH", "/api/tasks/1"));
        assert!(!is_write_allowed_for_role(Role::Viewer, "DELETE", "/api/comments/1"));
        assert!(is_write_allowed_for_role(Role::Viewer, "POST", "/api/notifications/read-all"));
        assert!(!is_write_allowed_for_role(Role::Viewer, "POST", "/api/notificationsX"));
        assert!(is_write_allowed_for_role(Role::Viewer, "POST", "/api/api-keys"));
        assert!(is_write_allowed_for_role(Role::Member, "POST", "/api/tasks"));
    }

    #[test]
    fn api_key_rules() {
        let (u1, u2) = ids();
        assert!(can_create_api_key_scope(Some(Role::Viewer), "read"));
        assert!(!can_create_api_key_scope(Some(Role::Viewer), "write"));
        assert!(can_create_api_key_scope(Some(Role::Member), "write"));
        assert!(!can_create_api_key_scope(None, "read"));
        assert!(can_manage_api_key(Some(Role::Member), u1, u1));
        assert!(!can_manage_api_key(Some(Role::Member), u1, u2));
        assert!(can_manage_api_key(Some(Role::Admin), u1, u2));
        assert!(!can_manage_api_key(Some(Role::Viewer), u1, u2));
    }

    #[test]
    fn membership_rules() {
        let (u1, u2) = ids();
        assert!(can_add_workspace_member(Role::Owner, Role::Owner));
        assert!(!can_add_workspace_member(Role::Admin, Role::Owner));
        assert!(can_add_workspace_member(Role::Admin, Role::Member));
        assert!(!can_add_workspace_member(Role::Member, Role::Viewer));
        assert!(!can_update_workspace_member_role(Role::Owner, Role::Owner, Role::Admin));
        assert!(can_update_workspace_member_role(Role::Owner, Role::Member, Role::Owner));
        assert!(!can_update_workspace_member_role(Role::Admin, Role::Member, Role::Owner));
        assert!(!can_deactivate_workspace_member(Role::Owner, Role::Member, u1, u1));
        assert!(!can_deactivate_workspace_member(Role::Owner, Role::Owner, u1, u2));
        assert!(can_deactivate_workspace_member(Role::Admin, Role::Member, u1, u2));
        assert!(!can_deactivate_workspace_member(Role::Member, Role::Viewer, u1, u2));
        assert!(can_delete_workspace(Role::Owner));
        assert!(!can_delete_workspace(Role::Admin));
    }
}
