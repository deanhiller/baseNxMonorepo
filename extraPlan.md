# Extra PRs — after PR #2 (strictNullChecks) lands

**Read `planPR1.md` first.** This file covers the remaining TS strict rollout after null-safety.

---

## Baseline state assumed by this doc

When you open this file to resume:
- `tsconfig.base.json` has `strictNullChecks: true` + `strictPropertyInitialization: true` (shipped in PR #2).
- Webpieces is at `0.2.108` (or newer).
- The size-limits window (`max-method-lines`/`max-file-lines` epoch bypass) has either expired or been bumped — don't rely on it for these PRs unless you explicitly extend it.
- All 4 projects build green.

If any of the above is not true, back up and finish PR #2 first.

---

## Per-flag error matrix (from previousEffort.md, pre-PR #2)

| Flag | client | server | apis | root-api-util | TOTAL | est. effort |
|---|--:|--:|--:|--:|--:|---|
| `noPropertyAccessFromIndexSignature` | 32 | 0 | 0 | 0 | **32** | ~1 hr |
| `noUnusedParameters` | 41 | 1 | 1 | 0 | **43** | ~1 hr |
| `noUnusedLocals` | 75 | 0 | 0 | 0 | **75** | ~2 hrs |
| `noImplicitAny` | 87 | 0 | 0 | 0 | **87** | **DEFERRED** (needs webpieces rule) |
| `strictTemplates` (Angular) | ? | — | — | — | UNMEASURED | measure first |
| `strictInjectionParameters` (Angular) | ? | — | — | — | UNMEASURED | |
| `strictInputAccessModifiers` (Angular) | ? | — | — | — | UNMEASURED | |

Re-measure each flag before starting its PR — counts drift as other flags land.

**Measurement recipe** (shared across PRs 3–5):

```bash
# Add one flag at a time, measure, restore base.
# Script still on disk: /tmp/flag-test.sh (standard compilerOptions flags).
# For Angular flags: /tmp/ng-flag-test.sh (written but never executed; takes ~5 min).

# Manual one-shot per flag:
cp tsconfig.base.json tsconfig.base.json.bak
# Then hand-edit to add e.g. "noUnusedLocals": true under compilerOptions
./node_modules/.bin/tsc --noEmit -p services/client/tsconfig.app.json 2>&1 | grep -cE "error TS"
./node_modules/.bin/tsc --noEmit -p services/server/tsconfig.app.json 2>&1 | grep -cE "error TS"
./node_modules/.bin/tsc --noEmit -p libraries/apis/tsconfig.lib.json 2>&1 | grep -cE "error TS"
mv tsconfig.base.json.bak tsconfig.base.json
```

---

## PR #3 — noPropertyAccessFromIndexSignature (32 errors)

**Mechanical rewrite**: `obj.foo` → `obj['foo']` when `foo` comes from an index signature.

### Steps

1. `git checkout -b ts-strict-no-property-access-from-index-sig`.
2. Add `"noPropertyAccessFromIndexSignature": true` to `tsconfig.base.json`.
3. Measure fresh count:
   ```bash
   ./node_modules/.bin/tsc --noEmit -p services/client/tsconfig.app.json 2>&1 | grep -cE "error TS"
   ```
4. For each error (TS4111), convert dot access to bracket access. Per-file list:
   ```bash
   ./node_modules/.bin/tsc --noEmit -p services/client/tsconfig.app.json 2>&1 \
     | grep "error TS4111" \
     | awk -F':' '{print $1}' | sort -u
   ```
5. Typical fix pattern:
   ```ts
   // before
   const value = config.someKey;
   // after
   const value = config['someKey'];
   ```
   If the type was `Record<string, T>` or similar, bracket access is the right answer. If the type _should_ have had a known property, consider whether the type should be narrowed instead (rare — usually the index-sig is genuinely dynamic).
6. Build green → ship.

### Watch-outs

- Don't go on a type-tightening crusade. If the existing type has `[key: string]: T`, bracket-access is correct; don't rewrite the type itself in this PR.
- For `process.env.FOO` patterns: `process.env` is typed as `{[key: string]: string | undefined}`, so this flag will hit. Convert to `process.env['FOO']`. Don't add a custom `EnvSchema` type in this PR — separate concern.

---

## PR #4 — noUnusedParameters + noUnusedLocals (118 errors)

Two flags, ship together (similar fix domain).

### Steps

1. `git checkout -b ts-strict-no-unused`.
2. Add both flags to `tsconfig.base.json`:
   ```json
   "noUnusedParameters": true,
   "noUnusedLocals": true,
   ```
3. Measure:
   ```bash
   ./node_modules/.bin/tsc --noEmit -p services/client/tsconfig.app.json 2>&1 \
     | grep -E "TS6133|TS6196|TS6198|TS6199" | wc -l
   ```
   Error codes:
   - **TS6133**: Unused variable / parameter
   - **TS6196**: Unused type
   - **TS6198**: Unused destructuring pattern
   - **TS6199**: Unused import
4. Per-file breakdown:
   ```bash
   ./node_modules/.bin/tsc --noEmit -p services/client/tsconfig.app.json 2>&1 \
     | grep -E "TS6133|TS6196|TS6198|TS6199" \
     | awk -F'(' '{print $1}' | sort | uniq -c | sort -rn | head -30
   ```

### Fix conventions

**`noUnusedParameters` (TS6133 on parameters):**
- If the signature is imposed by an interface / Angular lifecycle hook / RxJS operator and you genuinely can't use the param, prefix with `_`:
  ```ts
  canDeactivate(_component: any, _currentRoute: ActivatedRouteSnapshot) { return true; }
  ```
  (and yes, avoid `any` per the write-hook — use the real type.)
- If the param is genuinely dead (nothing forces the signature), remove it.

**`noUnusedLocals` (TS6133 on variables, TS6199 on imports, TS6196 on types):**
- Dead imports: delete.
- Dead types: delete, unless exported (then it's someone else's problem, investigate).
- Dead local vars: **read the context before deleting.** Sometimes a `const foo = expr()` is kept for the side effect of `expr()`. If so, drop the `const foo =` but keep the expression. If not, delete both.
- `useUnknownInCatchVariables` (already on from PR #0) means unused `catch (err)` parameters sometimes show up. Pattern: just omit the variable — `try { ... } catch { ... }`.

### Watch-outs

- **This PR may find real bugs.** A dead local that was supposed to be used usually means a wiring mistake. If you find one, decide whether to fix the bug in this PR or split it out. Prefer a separate commit labeled "fix: activate previously-unused X".
- **Don't rename vars to `_foo` as a shortcut to pass the check**. The `_` prefix is for parameters whose signature you can't change. For real unused locals, delete them.
- **Test files** often have unused imports (leftover from refactors). Clean them up.
- Angular `@HostListener('click', ['$event']) onClick(event: MouseEvent) { /* ignore event */ }` — if `event` is literally unused, prefix `_event` (the HostListener signature is fixed).

---

## PR #5 — Angular template strict flags

Three Angular-specific flags that live under `angularCompilerOptions`, not `compilerOptions`. They check template-side correctness.

### Flags

| Flag | What it catches |
|---|---|
| `strictTemplates` | Everything: binding types, directive inputs, event payloads, two-way binding, safe navigation |
| `strictInjectionParameters` | DI tokens where `providedIn` doesn't match injection context |
| `strictInputAccessModifiers` | Private/protected inputs used from templates |

### Steps

1. Measure first (counts are unknown as of this plan):
   ```bash
   bash /tmp/ng-flag-test.sh
   # Writes per-flag logs to /tmp/ng-flag-<name>.log, ~5 min total (3 builds × ~90s)
   ```
   If the script doesn't exist anymore, re-create it using the template below.
2. Based on counts, decide:
   - All 3 flags < 50 errors → ship as a single PR.
   - Any flag > 100 errors → split per-flag.
3. Flags go in `services/client/tsconfig.json` under `angularCompilerOptions` (NOT `compilerOptions`):
   ```json
   {
       "extends": "../../tsconfig.base.json",
       "compilerOptions": { ... },
       "angularCompilerOptions": {
           "strictTemplates": true,
           "strictInjectionParameters": true,
           "strictInputAccessModifiers": true
       }
   }
   ```
4. Build with `NX_DAEMON=false pnpm nx build client --skip-nx-cache` (template errors surface during Angular compilation, not `tsc --noEmit`).

### Typical template-error shapes + fixes

| Error | Fix |
|---|---|
| `Type 'string | undefined' is not assignable to type 'string'` in `{{ foo.bar }}` | `{{ foo?.bar ?? '' }}` in template, or narrow in component |
| Directive expects `[input]="X"` but got `Y` | Either widen the input type or pass the right type |
| `Property 'foo' is private and only accessible within class 'X'` | Change to `protected` (preferred for template-used properties) or `public` |
| `@Input() set foo(v: X)` misuse | Declare as `@Input()` field, don't mix setter and field |

### Watch-outs

- `strictTemplates` is the big one. If initial count is > 200, consider starting with only `strictInjectionParameters` + `strictInputAccessModifiers` and doing `strictTemplates` in its own PR.
- Some Angular Material / Fuse directives have known type gaps. If a third-party directive's types force a workaround, prefer `$any(foo)` in the template (Angular-specific escape hatch) over a TS cast. It's a known pattern and reviewers should accept it.
- Don't disable with `// @ts-ignore` in template expressions — Angular template type-checking doesn't honor those.

### /tmp/ng-flag-test.sh (if you need to recreate it)

Per previousEffort.md the script:
- Adds each of `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers` to `angularCompilerOptions` one at a time
- Runs `NX_DAEMON=false pnpm nx build client --skip-nx-cache`
- Counts `✘ [ERROR]` lines
- Writes per-flag logs to `/tmp/ng-flag-<name>.log`
- Restores base

If you need to rebuild it, the pattern matches `/tmp/flag-test.sh` (which worked for tsconfig flags). Adapt to edit `angularCompilerOptions` in `services/client/tsconfig.json` instead of `compilerOptions` in `tsconfig.base.json`.

---

## PR #6 — noImplicitAny via webpieces validator (BLOCKED)

### Why this is different

We cannot add `noImplicitAny: true` to `tsconfig.base.json`. Reason:
- `noImplicitAny` forces you to annotate parameters with *some* type.
- The webpieces `no-any-unknown` write hook (and build validator) forbids using `any` / `unknown` as the annotation.
- On Fuse demo code, inventing real types for every parameter is disproportionate effort.

### Solution

A new webpieces rule `validate-no-implicit-any` that uses the TypeScript TypeChecker to detect implicit-any (rather than the regex-based `no-any-unknown`). Run in `MODIFIED_CODE` mode so legacy Fuse code is grandfathered.

### Status

- **Plan doc exists**: `/Users/deanhiller/openclaw/personal/webpieces-ts30/PLAN-NO-IMPLICIT-ANY.md` — detection strategy, registration steps, rollout config, testing approach.
- **Template to follow**: `/Users/deanhiller/openclaw/personal/webpieces-ts30/packages/tooling/architecture-validators/src/executors/validate-no-any-unknown/executor.ts`.
- **Not yet implemented**. Needs to be built in webpieces-ts30, published as a new webpieces version, then enabled here.

### When unblocked

1. Upgrade webpieces in `baseNxMonorepo/package.json` to the version that ships `validate-no-implicit-any`.
2. Enable in `webpieces.config.json`:
   ```json
   "no-implicit-any": {
       "enabled": true,
       "mode": "MODIFIED_CODE",
       "disableAllowed": true
   }
   ```
3. **Do NOT** add `noImplicitAny` to `tsconfig.base.json` — the webpieces rule supersedes it and is the agreed enforcement mechanism.
4. Fix any flagged sites in modified code. Legacy Fuse code is grandfathered.

---

## Recommended PR ordering (after PR #2 ships)

1. **PR #3** — `noPropertyAccessFromIndexSignature` (fastest, mechanical)
2. **PR #4** — `noUnusedParameters` + `noUnusedLocals` (may find real bugs, worth doing before template work)
3. **PR #5a** — `strictInjectionParameters` + `strictInputAccessModifiers` if low count
4. **PR #5b** — `strictTemplates` on its own (biggest unknown)
5. **PR #6** — `noImplicitAny` via webpieces (blocked on webpieces-ts30 work)

---

## Cross-cutting watch-outs

1. **Don't set `strict: true`** at any level. It implies `noImplicitAny`, which conflicts with our webpieces rule. Stay with individual flags.
2. **Don't commit `.claude/scheduled_tasks.lock` or `.claude/settings.local.json`** — already known from previousEffort.md, gitignore first if those appear dirty.
3. **AI write hook rules to respect**: `no-any-unknown`, `require-return-type`, `no-destructure`, `no-unmanaged-exceptions`, `file-location`, `max-method-lines` (unless epoch-bypassed), `max-file-lines` (unless epoch-bypassed). If one fires during a fix, use `// webpieces-disable <rule> -- <reason>`.
4. **Never bypass webpieces hooks** by editing `webpieces.config.json` to disable a rule mid-task. If a rule genuinely needs to change, that's a conversation, not a shortcut.
5. **Platform node_modules trap**: `cat node_modules/.platform` should say `mac`. If it says `linux`, run `./scripts/build.sh swap` before any pnpm/nx command.
6. **Measure, don't guess.** Error counts drift as other flags land. Re-measure each flag before starting its PR.

---

## Key file locations (for fast navigation)

- This repo: `/Users/deanhiller/openclaw/personal/baseNxMonorepo`
- Webpieces source: `/Users/deanhiller/openclaw/personal/webpieces-ts30`
- Webpieces no-implicit-any plan: `/Users/deanhiller/openclaw/personal/webpieces-ts30/PLAN-NO-IMPLICIT-ANY.md`
- Original rollout plan: `~/.claude/plans/imperative-popping-cookie.md`
- Unified config: `/Users/deanhiller/openclaw/personal/baseNxMonorepo/webpieces.config.json`
- Claude hook entrypoint: `/Users/deanhiller/openclaw/personal/baseNxMonorepo/.webpieces/ai-hooks/claude-code-hook.js`
- Base tsconfig: `/Users/deanhiller/openclaw/personal/baseNxMonorepo/tsconfig.base.json`
