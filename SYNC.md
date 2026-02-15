# Repository Sync Documentation

This repository is a **public mirror** of the `@abbababa/sdk` package, which is developed in a private monorepo. Changes are automatically synchronized from the internal monorepo to this public repository.

## How Sync Works

### Automatic Sync

When changes are pushed to the following files in the internal monorepo:

```
packages/sdk/src/**
packages/sdk/package.json
packages/sdk/tsconfig.json
packages/sdk/README.md
packages/sdk/CHANGELOG.md
```

A GitHub Actions workflow automatically:

1. Detects the changes
2. Copies the files to this public repository
3. Transforms URLs in `package.json` and `README.md` to point to this repo
4. Commits and pushes the changes

**Sync time**: Typically 30-60 seconds after the internal commit.

### What Gets Synced

| File/Directory | Synced? | Transformation |
|----------------|---------|----------------|
| `src/` | ✅ Yes | None (copied as-is) |
| `package.json` | ✅ Yes | Repository URLs updated |
| `tsconfig.json` | ✅ Yes | None |
| `CHANGELOG.md` | ✅ Yes | None |
| `README.md` | ✅ Yes | GitHub URLs updated |
| Workflows | ❌ No | Managed separately in public repo |
| `CONTRIBUTING.md` | ❌ No | Public repo only |
| `SYNC.md` | ❌ No | Public repo only |

### URL Transformations

**package.json:**
```diff
- "repository": {
-   "type": "git",
-   "url": "https://github.com/kkalmanowicz/abbababa-platform",
-   "directory": "packages/sdk"
- }
+ "repository": {
+   "type": "git",
+   "url": "https://github.com/kkalmanowicz/abbababa-sdk"
+ }
```

**README.md:**
- All references to the internal monorepo are updated to point to this repo
- CI badge URLs are updated

## For External Contributors

### Contributing Process

1. **Fork this repository** and make your changes
2. **Open a pull request** with your proposed changes
3. **Maintainer review**: A core team member will review your PR
4. **Integration**: If approved, changes are manually ported to the internal monorepo
5. **Automatic sync**: Within 1 minute, your changes sync back to this public repo
6. **Credits**: You'll be credited as a co-author in the sync commit

**Important**: Your PR may be closed without merging. This is expected behavior — approved changes are integrated via the internal monorepo and synced back automatically.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

### Why This Approach?

- **Single source of truth**: Internal monorepo maintains consistency across all packages
- **Public collaboration**: External developers can contribute without monorepo access
- **Fast sync**: Automated workflow ensures public repo is always up-to-date
- **Security**: Private business logic stays private while SDK remains open source

## For Maintainers

### Manual Sync Trigger

If automatic sync fails or you need to force a sync:

1. Go to: [Internal monorepo Actions tab](https://github.com/kkalmanowicz/abbababa-platform/actions/workflows/sync-sdk.yml)
2. Click "Run workflow"
3. Select branch (usually `main`)
4. Click "Run workflow"

Sync completes in ~20-30 seconds.

### Handling External PRs

When an external contributor opens a PR:

1. **Review** the code in the public repo
2. **Test** locally if needed
3. **If approved**:
   - Create a new branch in internal monorepo: `git checkout -b external-pr-{number}`
   - Manually apply the same changes to `packages/sdk/`
   - Test thoroughly
   - Commit with co-author attribution:
     ```bash
     git commit -m "feat: description of change

     Co-authored-by: Contributor Name <email@example.com>"
     ```
   - Push to internal monorepo
   - Wait for automatic sync (~30 seconds)
   - Comment on external PR: "Thanks! Integrated via internal review. Changes synced."
   - Close the external PR (do not merge)

### Releasing a New Version

Version releases happen from the **internal monorepo**, then sync to public repo:

1. **Bump version** in internal monorepo:
   ```bash
   cd packages/sdk
   npm version patch  # or minor/major
   ```

2. **Update CHANGELOG.md** with release notes

3. **Commit and push** to internal monorepo:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore(sdk): release v0.4.1"
   git push origin main
   ```

4. **Wait for sync** (~30-60 seconds)

5. **Tag in public repo**:
   ```bash
   cd /tmp/abbababa-sdk
   git pull
   VERSION=$(node -p "require('./package.json').version")
   git tag "v${VERSION}"
   git push origin "v${VERSION}"
   ```

6. **Automated publish**: Pushing the tag triggers the publish workflow, which:
   - Builds the package
   - Publishes to npm with provenance
   - Creates a GitHub release

## Sync Workflow Details

### Workflow File Location

**Internal monorepo**: `.github/workflows/sync-sdk.yml`

### Triggers

- Push to `main` branch
- Changes to SDK files (see paths above)
- Manual trigger via workflow_dispatch

### Authentication

The sync workflow uses a GitHub Personal Access Token stored as `SDK_SYNC_TOKEN` in the internal monorepo's secrets. This token has `repo` scope and allows the workflow to push to this public repository.

**Token rotation**: The token expires every 90 days and must be rotated. See internal documentation for rotation process.

### Commit Messages

Sync commits follow this format:

```
sync: {original commit message}

Synced from abbababa-platform @ {short SHA}
```

This allows tracking which internal commit triggered each sync.

## Troubleshooting

### Sync Not Happening

1. **Check workflow status**: [Internal Actions](https://github.com/kkalmanowicz/abbababa-platform/actions/workflows/sync-sdk.yml)
2. **Verify file paths**: Ensure changes are in `packages/sdk/` (not elsewhere)
3. **Check token expiration**: `SDK_SYNC_TOKEN` may need rotation
4. **Manual trigger**: Use workflow_dispatch as described above

### Build Failing in Public Repo

1. **Verify local build**:
   ```bash
   cd /tmp
   git clone https://github.com/kkalmanowicz/abbababa-sdk.git
   cd abbababa-sdk
   npm install
   npm run build
   ```

2. **Check CI logs**: [Public repo Actions](https://github.com/kkalmanowicz/abbababa-sdk/actions)

3. **Fix in internal monorepo** and let sync propagate

### External PR Conflicts

If an external PR conflicts with internal changes:

1. Comment on the PR explaining the conflict
2. Provide guidance on rebasing
3. Alternatively, manually integrate the spirit of the PR internally

## Version History

- **v1.0 (2026-02-15)**: Initial sync setup with GitHub Actions automation
- **Future**: Potential bidirectional sync for certain file types (TBD)

---

For questions about the sync process, open an issue or contact the maintainers.
