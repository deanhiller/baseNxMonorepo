# PR #2 — strictNullChecks + strictPropertyInitialization

**Goal**: Enable `strictNullChecks: true` and `strictPropertyInitialization: true` in `tsconfig.base.json` without breaking the build. Expect ~252 errors (client-only; measured before PR #1 shipped, may drift). Ship in sub-PRs by feature area.

---

## Starting state (read this first on resume)

**Branch / commits shipped:**
```
4f19a01 ai hooks and build in sync      ← PR-W: webpieces 0.2.107 upgrade + config consolidation
acc9e7b fixes                            ← PR #1: strictFunctionTypes + noImplicitReturns + noFallthroughCasesInSwitch
a0b1267 commit base                      ← PR #0: 6 zero-error flags
```

**Uncommitted as of this plan:**
- `package.json` — `@webpieces/dev-config` bumped to `0.2.108`
- `pnpm-lock.yaml` — regenerated for 0.2.108
- `webpieces.config.json` — `max-method-lines` and `max-file-lines` `ignoreModifiedUntilEpoch` set to `1776470399` (2026-04-17 23:59:59 UTC)
- `planPR1.md` + `extraPlan.md` (this file + the sibling)

Decide whether to:
- (a) commit those uncommitted changes first as "chore: bump webpieces 108 + disable size limits during null-safety refactor", THEN start 2a on a fresh branch, or
- (b) bundle them into sub-PR 2a.

**Recommend (a)** — keeps the "why size limits are off" visible in git history independent of the null-safety work.

**Current tsconfig.base.json flags (as of 4f19a01):**
```json
"forceConsistentCasingInFileNames": true,
"strictBindCallApply": true,
"noImplicitThis": true,
"useUnknownInCatchVariables": true,
"noImplicitOverride": true,
"alwaysStrict": true,
"strictFunctionTypes": true,
"noImplicitReturns": true,
"noFallthroughCasesInSwitch": true,
```

None of these imply nulls. Both target flags are currently absent from `tsconfig.base.json` and from all project-level tsconfigs.

---

## Environment checklist (run on session resume)

```bash
# 1. Platform must match node_modules. If on Mac after Docker, swap.
cat node_modules/.platform       # expect: mac
./scripts/build.sh swap          # only if mismatch

# 2. Confirm webpieces 0.2.108 is installed and config-loader works.
cat node_modules/@webpieces/dev-config/package.json | grep version
# expect "0.2.108"

# 3. Confirm size limits are OFF (refactor window).
cat webpieces.config.json | grep -A2 max-method-lines | head -4
# expect ignoreModifiedUntilEpoch 1776470399 (or later)

# 4. Quick sanity.
NX_DAEMON=false pnpm nx run architecture:validate-complete --skip-nx-cache
```

---

## The size-limits window is finite

`webpieces.config.json` has `ignoreModifiedUntilEpoch: 1776470399` (2026-04-17 23:59:59 UTC) on:
- `max-method-lines` (would normally enforce 80-line cap)
- `max-file-lines` (would normally enforce 902-line cap)

While these are OFF, refactors can freely balloon methods/files. Once the epoch passes, both re-apply — if a PR hasn't landed yet, bump the epoch again OR fix the sizes. The semantics (confirmed from `node_modules/@webpieces/architecture-validators/src/executors/validate-return-types/executor.js:379-391`): `now_seconds < epoch → mode downgraded to OFF`. No hidden side effects.

**Other rules still fire** (`require-return-type`, `no-any-unknown`, `no-destructure`, `no-unmanaged-exceptions`, etc.). Don't write `: any` as a shortcut — the `no-any-unknown` pre-write hook will block it.

---

## Flag interaction facts

1. `strictPropertyInitialization: true` requires `strictNullChecks: true` (TS5052). Flip both or neither.
2. `strict: true` at a project level would imply both, **plus** `noImplicitAny`, which we explicitly do **not** want (see extraPlan.md PR #6). Do **not** set `strict: true`. Flip the two target flags individually.
3. `services/server/tsconfig.json` and `libraries/apis/tsconfig.json` already set `strict: true` — they should compile clean after base flip. `libraries/root-api-util` is essentially empty.
4. All 12 tsconfigs extend `tsconfig.base.json` (verified in the previous session). No special per-project tsconfig surgery is required.

---

## Attack order — 4 sub-PRs

Ship them in this order. Each sub-PR includes a measurement step so numbers stay honest.

### Sub-PR 2a — libraries/apis + services/server + libraries/root-api-util

**Goal**: Prove the two target flags are safe at the base level for the non-client projects. These are already `strict: true` so expected count is ~0.

**Steps:**
1. `git checkout -b ts-strict-null-safety-2a` (or similar).
2. Edit `tsconfig.base.json` — add under `compilerOptions`:
   ```json
   "strictNullChecks": true,
   "strictPropertyInitialization": true,
   ```
3. Measure:
   ```bash
   ./node_modules/.bin/tsc --noEmit -p libraries/apis/tsconfig.lib.json 2>&1 | grep -cE "error TS"
   ./node_modules/.bin/tsc --noEmit -p libraries/root-api-util/tsconfig.lib.json 2>&1 | grep -cE "error TS"
   ./node_modules/.bin/tsc --noEmit -p services/server/tsconfig.app.json 2>&1 | grep -cE "error TS"
   ```
   Expected: 0, 0, 0. If anything > 0, fix it in this PR before moving on (small blast radius).
4. **Do NOT** run the full `nx run-many -t build` yet — client will still be broken. That's expected and is 2b's job.
5. Commit. If all three are 0, the diff is **one file** (`tsconfig.base.json`) — ship that alone.
6. **Important**: do NOT merge 2a to main until 2b–2d are staged behind it. Merging 2a alone breaks the client build. Either:
   - Keep all sub-PRs on a single integration branch, merge to main once 2d is done, OR
   - Add `strictNullChecks: false` + `strictPropertyInitialization: false` in `services/client/tsconfig.json` **temporarily** in 2a so the client build stays green. Remove that override in 2d.

**Recommend the override approach** — keeps each sub-PR independently shippable and main green at every step. Concrete pattern for 2a:

```json
// services/client/tsconfig.json — add compilerOptions override
{
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "strictNullChecks": false,           // TEMP: removed in sub-PR 2d
        "strictPropertyInitialization": false // TEMP: removed in sub-PR 2d
    },
    ...
}
```

### Sub-PR 2b — services/client @fuse/ components

**Goal**: Fix null-safety errors in `services/client/src/@fuse/`. This is Fuse demo code; expect generous use of `?`, `!`, and `| undefined`.

**Measure first:**
```bash
./node_modules/.bin/tsc --noEmit -p services/client/tsconfig.app.json 2>&1 \
  | grep -E "error TS" | grep -E "src/@fuse/" | wc -l
```

Also dump a per-file breakdown to target:
```bash
./node_modules/.bin/tsc --noEmit -p services/client/tsconfig.app.json 2>&1 \
  | grep -E "error TS" \
  | grep -E "src/@fuse/" \
  | awk -F'(' '{print $1}' | sort | uniq -c | sort -rn | head -30
```

Typical @fuse error shapes and fixes:

| Error shape | Fix |
|---|---|
| `Object is possibly 'undefined'` on `this.control.value` | `this.control?.value` or non-null assert `this.control!.value` if the control is guaranteed present by lifecycle |
| `Type 'X | undefined' is not assignable to X` on an `@Input()` | Declare input as `@Input() foo: X | undefined` or `@Input() foo!: X` with a comment explaining the guarantee |
| `Property 'X' has no initializer and is not definitely assigned in constructor` | Either `foo!: T` (definite assignment assertion) with justification, or `foo: T | undefined`, or initialize in ctor |
| `Argument of type 'string | undefined' is not assignable to parameter of type 'string'` | Optional chaining + nullish coalescing: `foo ?? ''`, or early-return null guard |
| `this._subscription.unsubscribe()` on `Subscription | undefined` | Optional chain: `this._subscription?.unsubscribe()` |

**Conventions for this PR (to keep diffs boring and reviewable):**
- Prefer `?.` and `??` over `!`. Use `!` only when the invariant is enforced elsewhere (e.g. `@ViewChild` that's guaranteed after `ngAfterViewInit`).
- When using `!`, add a one-line comment explaining *why* the value can't be null (e.g. `// Set in ngOnInit before any template interaction`). This is the one case comments are worth it.
- For Angular `@Input()` properties that must be provided by the caller, use `foo!: T` (definite assignment). For genuinely optional inputs, use `foo: T | undefined`.
- Do **not** turn `private _service: FooService` into `private _service?: FooService`. Services are DI-guaranteed non-null; use `!` if the linter complains.
- Do **not** add `any` as an escape hatch — the `no-any-unknown` write hook will block it anyway.
- If a single file has > 20 errors and fixing it balloons methods past 80 lines, that's fine — the size-limits window is why we're doing this now.

**Order within 2b** (avoid touching everything at once):
1. `@fuse/components/` (largest subtree — alert, card, drawer, highlight, loading-bar, navigation, etc.)
2. `@fuse/services/` (config, confirmation, loading, media-watcher, splash-screen, utils)
3. `@fuse/lib/` (mock-api)
4. `@fuse/animations`, `@fuse/directives`, `@fuse/pipes`, `@fuse/validators` (small)

Commit after each sub-area if you want extra granularity. Re-run the @fuse error count after each commit; it should monotonically decrease.

**Finalization for 2b:**
- After @fuse errors reach 0, the client build is still red because `modules/admin/*` etc. haven't been touched. Leave the `strictNullChecks: false` override in place in `services/client/tsconfig.json`.
- To keep 2b independently mergeable, **don't flip the override yet**. 2b's diff is purely in `src/@fuse/`.

### Sub-PR 2c — modules/admin/apps/*

**Goal**: Fix null-safety errors in the admin app demo modules (contacts, ecommerce, scrumboard, tasks, etc.).

**Measure:**
```bash
./node_modules/.bin/tsc --noEmit -p services/client/tsconfig.app.json 2>&1 \
  | grep -E "error TS" | grep -E "src/app/modules/admin/" | wc -l
```

Per-file breakdown:
```bash
./node_modules/.bin/tsc --noEmit -p services/client/tsconfig.app.json 2>&1 \
  | grep -E "error TS" \
  | grep -E "src/app/modules/admin/" \
  | awk -F'(' '{print $1}' | sort | uniq -c | sort -rn | head -30
```

The same conventions from 2b apply. Expected hotspots (already seen in PR #1):
- `modules/admin/apps/contacts/contacts.service.ts` + `contacts/list/list.component.ts`
- `modules/admin/apps/ecommerce/inventory/inventory.service.ts`
- `modules/admin/apps/scrumboard/scrumboard.service.ts`
- `modules/admin/apps/tasks/tasks.service.ts` + `tasks/list/list.component.ts`

These are demo CRUD services — a lot of `find()` returns `T | undefined` that the old code treated as `T`. Fix by early-returning a 404-style error (for services backed by real HTTP) or by `!`-asserting with a comment for pure demo code.

### Sub-PR 2d — remainder + remove the client override

**Goal**: Fix everything else and remove the temporary `strictNullChecks: false` override from `services/client/tsconfig.json`.

**Process:**
1. Remove `strictNullChecks: false` + `strictPropertyInitialization: false` from `services/client/tsconfig.json`.
2. Re-measure:
   ```bash
   ./node_modules/.bin/tsc --noEmit -p services/client/tsconfig.app.json 2>&1 | grep -cE "error TS"
   ```
3. Fix remaining errors — likely in `auth/`, `layout/`, `mock-api/` (if not fully covered in 2b), `core/`, shared pipes/directives.
4. Run the full build to confirm:
   ```bash
   NX_DAEMON=false pnpm nx run-many -t build
   ```
5. Ship.

### Final cleanup after 2d lands

- Consider restoring `max-method-lines` and `max-file-lines` epochs to something earlier (e.g. today) if the refactor is done and you want the limits back on. OR let the current epoch expire naturally on 2026-04-17 23:59:59 UTC.
- Run a spot-check build to make sure nothing sneaked past the size limits during the refactor window.

---

## Critical files

**Must modify:**
- `/Users/deanhiller/openclaw/personal/baseNxMonorepo/tsconfig.base.json` — add the two flags (sub-PR 2a).
- `/Users/deanhiller/openclaw/personal/baseNxMonorepo/services/client/tsconfig.json` — add temp override (2a), remove it (2d).
- Many files under `/Users/deanhiller/openclaw/personal/baseNxMonorepo/services/client/src/` across 2b/2c/2d.

**Read, don't modify:**
- `/Users/deanhiller/openclaw/personal/baseNxMonorepo/webpieces.config.json` — sanity-check epoch is still in the future before starting.
- `/Users/deanhiller/openclaw/personal/baseNxMonorepo/services/server/tsconfig.json` + `libraries/apis/tsconfig.json` — already strict, should not need changes.

---

## Verification checklist (end of PR #2 overall)

- [ ] `grep strictNullChecks tsconfig.base.json` finds it at `true`.
- [ ] `grep strictPropertyInitialization tsconfig.base.json` finds it at `true`.
- [ ] `services/client/tsconfig.json` does NOT contain `strictNullChecks: false` (that was a temporary override).
- [ ] `NX_DAEMON=false pnpm nx run-many -t build` green for all 4 projects.
- [ ] `grep -cE "error TS" <(tsc --noEmit -p services/client/tsconfig.app.json 2>&1)` → 0.
- [ ] AI write hook still fires (test with `function foo(x: any)` — should block).
- [ ] No `any` or `unknown` added anywhere (write hook would have blocked, but spot-grep to be sure).
- [ ] No `// @ts-ignore` or `// @ts-expect-error` added as a shortcut. If any were added, each has a one-line justification comment.

---

## Watch-outs

1. **Angular template checks are separate.** `strictNullChecks` in TS ≠ `strictTemplates` in Angular. The template-side flags (`strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers`) are PR #5 in `extraPlan.md`. Don't try to combine — different error-surface.
2. **RxJS `Subscription` teardown**: `this._sub?.unsubscribe()` is almost always correct. Don't `!`-assert subscriptions unless lifecycle guarantees non-null.
3. **`MatDialogRef`, `MatSnackBarRef`, etc.**: These are DI-injected and non-null for their component. Use `!` in private fields with a comment.
4. **Test files (`.spec.ts`)**: Same rules. Don't special-case.
5. **Don't bypass hooks**. Write-hook is still enforcing `no-any-unknown`, `require-return-type`, etc. If a legit fix genuinely needs an exception, use `// webpieces-disable <rule> -- <reason>` inline.
6. **Method-size window expires 2026-04-17 23:59:59 UTC.** If you're past that and still refactoring, bump the epoch in `webpieces.config.json` before continuing. After the refactor lands, either restore the old epoch or let it expire on its own to re-lock the size limits.
7. **Don't flip `strict: true`.** That would pull in `noImplicitAny`, which conflicts with our webpieces `no-any-unknown` write-hook. Stay with the individual flags.
