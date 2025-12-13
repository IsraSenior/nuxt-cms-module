# Release Checklist

Use this checklist for every release to ensure consistency and completeness.

## Pre-Release (Code Freeze)

### 1. Code Quality
- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm run typecheck`)
- [ ] No linting errors (`pnpm run lint`)
- [ ] Build succeeds (`pnpm run build`)
- [ ] Playground works (`pnpm dev`)

### 2. Version Bump
- [ ] Update version in `package.json`
- [ ] Version follows semver:
  - **PATCH** (x.x.X): Bug fixes, no breaking changes
  - **MINOR** (x.X.x): New features, backward compatible
  - **MAJOR** (X.x.x): Breaking changes

### 3. Documentation Updates

#### CHANGELOG.md
- [ ] Add new version section with date
- [ ] List all changes under appropriate categories:
  - **Added**: New features
  - **Changed**: Changes in existing functionality
  - **Deprecated**: Soon-to-be removed features
  - **Removed**: Removed features
  - **Fixed**: Bug fixes
  - **Security**: Security fixes
- [ ] Include migration notes if breaking changes
- [ ] Link to GitHub compare view (optional)

#### README.md
- [ ] Update compatibility table (if changed)
- [ ] Update feature list (if new features)
- [ ] Update code examples (if API changed)
- [ ] Update screenshots (if UI changed)
- [ ] Verify all badges work (version badge auto-updates)
- [ ] Update "Currently working on" section in Support section
- [ ] Add migration warnings if breaking changes

#### ROADMAP.md
- [ ] Move completed items from "In Progress" to "Completed"
- [ ] Update version status (e.g., v1.0.2 ✅ Released)
- [ ] Add release date to completed version
- [ ] Update next version checklist
- [ ] Update "Current Focus" section

#### Other Docs
- [ ] Update CONTRIBUTING.md if development process changed
- [ ] Update API documentation if endpoints changed
- [ ] Update migration guides if needed
- [ ] Check all internal documentation links still work

### 4. Dependencies
- [ ] All dependencies up to date (or documented why not)
- [ ] No known security vulnerabilities (`npm audit`)
- [ ] `pnpm-lock.yaml` committed

### 5. Build & Distribution
- [ ] Run `pnpm run dev:prepare`
- [ ] Run `pnpm run build`
- [ ] Verify `dist/` folder contents are correct
- [ ] Check bundle size hasn't increased significantly
- [ ] Test built module in external project:
  ```bash
  # In a test Nuxt project
  pnpm add file:../path/to/nuxt-cms-module
  pnpm dev
  ```

---

## Release Process

### 1. Commit All Changes
```bash
git status
git add .
git commit -m "chore: prepare release v1.0.X"
```

**Commit message format:**
- NO Claude attribution
- NO "Generated with" messages
- NO "Co-Authored-By" unless human collaborator

### 2. Create Git Tag
```bash
git tag v1.0.X
git push origin main
git push --tags
```

### 3. Publish to npm

#### Login (if not already)
```bash
npm whoami
# If not logged in:
npm login
```

#### Dry Run (optional but recommended)
```bash
npm publish --dry-run
```

Review what will be published.

#### Publish
```bash
npm publish
```

#### Verify
```bash
npm view @neskeep/nuxt-cms version
```

Should show the new version.

### 4. GitHub Release (optional but recommended)

Create a GitHub Release:
1. Go to https://github.com/neskeep/nuxt-cms-module/releases/new
2. Select the tag you just created
3. Title: `v1.0.X`
4. Description: Copy from CHANGELOG.md
5. Mark as "Latest release"
6. Publish release

Or via CLI:
```bash
gh release create v1.0.X --title "v1.0.X" --notes-file docs/CHANGELOG.md
```

---

## Post-Release

### 1. Verify npm
- [ ] Package visible on npm: https://www.npmjs.com/package/@neskeep/nuxt-cms
- [ ] Version number correct
- [ ] README displays correctly
- [ ] Install works: `npm install @neskeep/nuxt-cms@1.0.X`

### 2. Verify GitHub
- [ ] Tag created and visible
- [ ] Release created (if applicable)
- [ ] README displays correctly
- [ ] All badges show correct info

### 3. Test in Real Project
- [ ] Create a fresh Nuxt project
- [ ] Install the new version
- [ ] Run through basic features
- [ ] Verify no breaking changes (unless major version)

### 4. Announcements (optional)
- [ ] Post on GitHub Discussions
- [ ] Tweet/social media (if applicable)
- [ ] Update project website (if applicable)
- [ ] Notify key users of breaking changes (if major version)

### 5. Prepare Next Version
- [ ] Create new "Unreleased" section in CHANGELOG.md
- [ ] Update ROADMAP.md with next version goals
- [ ] Close completed GitHub Issues
- [ ] Update GitHub Project board (if using)

---

## Emergency Rollback

If critical issue found after release:

### 1. Deprecate on npm (not recommended, only for severe issues)
```bash
npm deprecate @neskeep/nuxt-cms@1.0.X "Critical bug, use 1.0.Y instead"
```

### 2. Publish Hotfix
- [ ] Create branch: `git checkout -b hotfix/1.0.X`
- [ ] Fix the critical issue
- [ ] Bump to patch version (e.g., 1.0.X+1)
- [ ] Follow release checklist
- [ ] Publish ASAP
- [ ] Undeprecate previous version if needed

---

## Version Numbering Examples

**v1.0.2 → v1.0.3** (PATCH)
- Bug fix in avatar upload
- Security fix
- Documentation correction
- Performance improvement (no API change)

**v1.0.2 → v1.1.0** (MINOR)
- New field type added
- New composable added
- New feature (backward compatible)
- Deprecated feature (still works)

**v1.0.2 → v2.0.0** (MAJOR)
- Breaking API change
- Removed deprecated features
- Changed database schema (requires migration)
- Changed configuration format
- Dropped support for Nuxt 3 (hypothetical)

---

## Common Mistakes to Avoid

❌ **DON'T:**
- Forget to update CHANGELOG.md
- Forget to update ROADMAP.md
- Leave "Currently working on" section outdated in README
- Publish without testing built module
- Forget to create git tag
- Include development files in npm package
- Add Claude/AI attribution to commits
- Push directly to protected branch without PR

✅ **DO:**
- Test thoroughly before releasing
- Update all documentation
- Follow semantic versioning strictly
- Keep CHANGELOG.md detailed
- Communicate breaking changes clearly
- Tag releases in git
- Test the published package
- Review files included in publish (`npm pack --dry-run`)

---

## Quick Reference

```bash
# Full release flow
pnpm run dev:prepare
pnpm run build
git add .
git commit -m "chore: prepare release v1.0.X"
git push
git tag v1.0.X
git push --tags
npm publish
gh release create v1.0.X --title "v1.0.X" --notes-file docs/CHANGELOG.md
```

---

**Last Updated:** 2025-12-13
**Next Review:** Before v1.1.0 release
