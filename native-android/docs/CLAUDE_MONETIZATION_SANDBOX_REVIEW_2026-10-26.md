# Claude sandbox investigation review — 26 October 2026

Actual Claude CLI reviewed a proposed server-side product-mapping reconciliation with tools disabled. No customer email, app-user ID, purchase/order ID or credentials were included in that review prompt. The local result is `/tmp/energy-mapping-claude-review.json`.

Claude found no immediate code-level blocker but raised two medium concerns: project-wide keys can mix app scopes, and the SDK product-mapping endpoint is not a documented server contract. It also recommended identifying the provider-side cause instead of retaining a workaround for a configuration problem.

The decisive live diagnostic was RevenueCat's customer card: the account did not have sandbox entitlement access. Project settings had **Allowed App User IDs only**, with **0 items**. Adding the one intended test account resolved the missing entitlement. This matches RevenueCat's documented sandbox-access policy.

The proposed reconciliation and its tests were removed. Staging functions were restored to the original entitlement-only source as version 5; production was not deployed. The final change is dashboard configuration plus acceptance evidence. The 260-test experiment result applies only to the discarded proposal. The retained source's 12 handler tests were rerun and passed with zero failures/skips; the existing 240-test backend baseline remains historical validation.
