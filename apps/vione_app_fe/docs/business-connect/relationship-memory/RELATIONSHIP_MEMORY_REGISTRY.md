# BC-9.1 Turn A — Relationship Memory Registry

The registry is the SINGLE source of truth for memory kinds and their
supporting sets. Any change bumps `RELATIONSHIP_MEMORY_VERSION`.

## Kinds

| Kind                | Default sensitivity |
| ------------------- | ------------------- |
| preference          | standard            |
| interest            | standard            |
| role_context        | public_ok           |
| communication_style | standard            |
| goal                | sensitive           |
| constraint          | sensitive           |
| shared_history      | standard            |
| commitment          | sensitive           |
| milestone           | public_ok           |
| risk_flag           | restricted          |
| opportunity_signal  | sensitive           |
| personal_context    | restricted          |

## Subject types

`person`, `organization`, `relationship`, `opportunity`.

## Statuses

`candidate`, `active`, `superseded`, `dismissed`, `expired`. Terminal:
`dismissed`, `expired`.

## Link kinds

`supports`, `refines`, `contradicts`, `supersedes`, `related`.

## Feedback kinds

`accept`, `reject`, `edit`, `flag_sensitive`, `request_forget`.

## Allowed source domains

`meeting_safe`, `meeting_outcome_safe`, `follow_up_safe`, `agenda_safe`,
`shared_notes_safe`, `introduction_safe`, `connection_relationship_safe`,
`person_profile_safe`, `association_company_safe`,
`relationship_graph_safe`, `work_hub_items`, `notification_action_safe`.

## Excluded source domains (HARD ban)

`private_meeting_notes`, `hidden_contact_details`, `raw_email_inbox`,
`unrestricted_notification_payloads`, `raw_audit_logs`,
`raw_timeline_metadata`, `provider_secrets`, `auth_identifiers`,
`cross_tenant_data`.
