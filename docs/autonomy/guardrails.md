# Autonomy Guardrails Contract

The `AutonomyGuardrailsAgent` enforces pre-flight checks before any high-risk automation can mutate the repository. The contract focuses on three pillars: verifying prerequisites, validating the workspace with deterministic commands, and emitting auditable feedback for operators.

## Required prerequisites

Before invoking the agent, the execution environment must explicitly opt-in and identify the repository:

- `AUTONOMY_APPROVED` must be set to `true`. This flag documents that a human reviewed the queued automation and approved the run.
- `CURRENT_REPOSITORY`, `REPOSITORY_NAME`, or `GITHUB_REPOSITORY` must resolve to the active repository name.
- `REPOSITORY_ALLOWLIST` must contain the repository name (comma-separated list). Automation is denied if the allowlist is empty or missing.

These values can also be provided programmatically when instantiating the agent (see the `AutonomyGuardrailsAgentOptions` type).

## Validation pipeline

When the prerequisites succeed, the agent executes the following commands in order. The first failure aborts automation and reports actionable remediation guidance:

1. `npm run lint`
2. `npm run test`
3. `npx prettier --check .`

Each command is expected to exit with status code `0`. Non-zero exit codes surface the captured stderr/stdout output along with recommended next steps (for example, "Run `npm run lint` locally and resolve lint issues before retrying").

## Policy layering and audit logging

Policies are evaluated before the validation pipeline runs. Every policy returns either `allowed` or `blocked`:

- `EnvironmentApprovalPolicy` verifies the approval flag.
- `RepositoryAllowlistPolicy` ensures the repository is explicitly allowlisted.

Additional policies can be injected through the agent options to extend the guardrails (e.g., runtime capability checks, branch protection rules, or dependency verification). When any policy denies automation, the agent stops immediately and emits an audit event via the provided `auditLogger` (defaults to `console.warn`). The audit payload includes the policy name, reason, suggested remediation, and timestamp so operators can triage the denial.

## Extensibility points

- **Command runner** – supply a custom `commandRunner` to integrate with task queues or remote executors.
- **Policy customization** – override `policies` or append to the default set to enforce organization-specific controls.
- **Command list** – replace `commands` to adjust which validations must pass before automation is allowed.
- **Audit sink** – provide `auditLogger` to persist denial events to observability backends or security tooling.

## Testing guidance

Vitest coverage exercises the default contract by stubbing failures for each phase. When commands or policies fail, the agent returns `{ ready: false }` with structured reports and never launches downstream automation.
