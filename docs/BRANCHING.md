# Branching Policy - DCCMS Management System

This document defines the git branching model, commit guidelines, and workspace constraints for development on the daycare center management system.

## Branch Hierarchy

All development is structured around the `management-system` integration branch:

```text
management-system (Stable Base)
  ├── dev-shared-contract (Task 2: shared typescript types & fixtures)
  ├── dev-backend-tasks   (Tasks 3-5: Cloudflare D1 schema, authentication & sync APIs)
  └── dev-frontend-tasks  (Tasks 6-8: protected staff screens, IndexedDB & PWA sync)
```

## Workspace Constraints

### ⚠️ Token-Conservation Rule (NO WORKTREES)
*   **Do not create or use Git Worktrees (`git worktree`)** during development.
*   Worktree creation resets AI context caching and triggers heavy project re-indexing, which quickly consumes the remaining token quota.
*   All development must be conducted **in-place** inside your active workspace directory.

### Sequential Branch Development
To prevent physical file conflicts while working in a single directory:
1.  Develop the shared contract and schemas first on `dev-shared-contract` and merge it back.
2.  Develop backend primitives on `dev-backend-tasks` and merge them back.
3.  Develop frontend UI and PWA synchronization on `dev-frontend-tasks` and merge them back.

---

## Required Workflow

### 1. Create a Task Branch
Always branch off of `management-system`:
```bash
# Ensure you are on the base branch and up to date
git switch management-system
git pull origin management-system

# Create your task-specific branch
git switch -c dev-shared-contract

# Publish the branch and set the upstream on first push
git push -u origin dev-shared-contract
```

### 2. Commit Often with Descriptive Messages
Use structured prefix commit messages:
*   `feat:` for new capabilities or routes
*   `test:` for tests and fixtures
*   `docs:` for spec or roadmap updates
*   `fix:` for bug resolution

### 3. Merge Back via Non-Fast-Forward Merge
When a task block is completed and verified, push the final branch state, then merge it back into
`management-system` using the `--no-ff` flag to preserve the merge history:
```bash
# Push the completed branch before merging
git push origin dev-shared-contract

git switch management-system
git merge --no-ff dev-shared-contract

# Publish the updated integration branch
git push origin management-system
```

---

## Conflict Resolution

*   **Preserve Local Changes:** Never discard or overwrite unrelated local changes in your workspace.
*   **Resolve Safely:** Only resolve conflicts when the expected result is clear and unambiguous from the spec files.
*   **Stop and Ask:** If a conflict involves complex logic or user-authored changes, stop and ask before proceeding.
