# RELATIONSHIP_TIMELINE_EVENT_CONTRACT

## Event mapping matrix

Column notation:

- **source event** — the domain lifecycle transition.
- **timeline kind** — `event_kind` value stored in
  `graph_timeline_events`. Matches BC-4.1 edge kind when derived from
  an edge write.
- **category** — UI grouping projected by `categoryFor()`.
- **summary key** — i18n key from the graph registry
  (`graph.timeline.<lowercase_kind>`).
- **metadata allowlist** — enforced by BC-4.2 registry.

### Already emitting through BC-4.2 (no changes)

| source event                  | timeline kind  | category      | summary key                   | metadata allowlist  |
| ----------------------------- | -------------- | ------------- | ----------------------------- | ------------------- |
| Connection accepted           | `CONNECTED_TO` | connection    | `graph.timeline.connected_to` | `source`            |
| Card saved                    | `SAVED_CARD`   | card          | `graph.timeline.saved_card`   | `source`            |
| Card shared (via save)        | `SAVED_BY`     | card          | `graph.timeline.saved_by`     | —                   |
| Person met (BC-4.2 met event) | `MET`          | meeting_touch | `graph.timeline.met`          | `context`           |
| Membership joined             | `MEMBER_OF`    | membership    | `graph.timeline.member_of`    | `role`              |
| Membership reflected          | `HAS_MEMBER`   | membership    | `graph.timeline.has_member`   | —                   |
| Employment started            | `WORKS_FOR`    | work          | `graph.timeline.works_for`    | `role`, `isCurrent` |
| Attended event                | `ATTENDED`     | meeting_touch | `graph.timeline.attended`     | `ticketType`        |
| Managed relationship          | `MANAGES`      | work          | `graph.timeline.manages`      | —                   |

### Extension slots — reserved for future BC-6 / BC-7 emission

The kinds below are recognized by the product mapper so that when a
downstream slice (Meeting Request Lifecycle, Outcome Dispatch) begins
emitting them through BC-4.2 write paths, the timeline picks them up
without further code changes.

| source event                           | timeline kind       | category     | summary key                        |
| -------------------------------------- | ------------------- | ------------ | ---------------------------------- |
| Introduction delivered (BC-6.3)        | `INTRO_DELIVERED`   | introduction | `graph.timeline.intro_delivered`   |
| Introduction outcome resolved (BC-6.4) | `INTRO_OUTCOME`     | introduction | `graph.timeline.intro_outcome`     |
| Meeting proposed                       | `MEETING_PROPOSED`  | meeting      | `graph.timeline.meeting_proposed`  |
| Meeting confirmed                      | `MEETING_CONFIRMED` | meeting      | `graph.timeline.meeting_confirmed` |
| Meeting completed                      | `MEETING_COMPLETED` | meeting      | `graph.timeline.meeting_completed` |

Adding these kinds to the frozen BC-4.1 registry is deferred to the
respective domain slices per BC-0.5 domain boundaries. BC-7.5
intentionally does not mutate the registry to preserve manifest
hash stability.

## Idempotency

BC-7.5 reuses `graph_timeline_events.dedupe_key` unchanged:
`edge:<edge_id>` for edge-derived rows. Domain projections that ever
emit outside the edge path must produce a stable key such as
`<domain>:<sourceId>:<kind>:<version>`. Replays must not produce
duplicate rows — the partial unique index on `dedupe_key` enforces
this.

## No duplicate semantics

The product mapper does not introduce new semantic kinds. Where a
BC-4.1 kind already expresses an event (e.g. `MET` for
meeting-touchpoints, `CONNECTED_TO` for accepted connections) the
registry entry is authoritative. New kinds are added only in the
"extension slots" table above when a source domain genuinely lacks
one.
