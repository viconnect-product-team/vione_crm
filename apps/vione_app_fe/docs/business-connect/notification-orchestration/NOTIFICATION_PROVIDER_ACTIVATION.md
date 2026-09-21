# Provider Activation Status

| Channel | Provider    | Enabled | Notes                                                       |
| ------- | ----------- | ------- | ----------------------------------------------------------- |
| in_app  | internal    | ✅      | Canonical persistence = delivery. Fully live.               |
| email   | unavailable | ❌      | **Deferred.** Adapter contract only; returns `unsupported`. |
| push    | unavailable | ❌      | **Deferred.** Adapter contract only; returns `unsupported`. |

## Activating email

1. Provision an email provider secret via the connector flow.
2. Implement a real `NotificationChannelAdapter` for `channel: "email"`.
3. Register it via a project-local `NotificationProviderRegistry` (replacing
   `UnsupportedEmailAdapter`).
4. Update `DEFAULT_PREFERENCES.emailEnabled` if the project wants email on
   by default.
5. No schema change required — dispatch rows for email are already produced
   when preferences enable it.

## Activating push

Same as email, plus a device-token registry table with per-user tokens and
revocation, and a real push adapter.

## Failure posture until activated

Dispatches created for email/push channels dead-letter immediately with
`last_error_code='unsupported_channel'`. No fake success is recorded.
