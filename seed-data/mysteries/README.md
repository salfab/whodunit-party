# Mystery Packs

This folder contains mystery pack ZIP files for seeding the database.

## Structure

Each ZIP should contain:
- `mystery.json` - Mystery metadata and content
- `images/` - Optional folder with character/cover images

## Versioning

**Always include a version in mystery.json:**

```json
{
  "version": "1.0.0",
  "title": "Murder at the Manor",
  "author": "Your Name",
  ...
}
```

### Version Rules

- **No version**: Won't overwrite existing mysteries (safe default)
- **Same version**: Skipped (already exists)
- **Older version**: Skipped (newer version already in database)
- **Newer version**: Replaces existing mystery

### Version Guidelines

Use semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR** (1.0.0 → 2.0.0): Significant changes to mystery structure, plot, or characters
- **MINOR** (1.0.0 → 1.1.0): New content, improved descriptions, or additional characters
- **PATCH** (1.0.0 → 1.0.1): Typo fixes, small wording changes, image updates

## File Naming

Use clean slugs for file names:
```
manor-mystery.zip
detective-noir.zip
christmas-murder.zip
```

## Seeding

```bash
npm run seed:mysteries
```

This script:
- Uploads all mystery packs from this folder
- Skips duplicates automatically
- Updates mysteries when newer versions are provided
- Logs detailed results for each upload

## Example mystery.json

```json
{
  "version": "1.0.0",
  "title": "Murder at the Manor",
  "description": "# The Crime\n\nLord Blackwood has been found dead...",
  "language": "fr",
  "author": "Mystery Writer",
  "theme": "SERIOUS_MURDER",
  "image_path": "images/cover.jpg",
  "innocent_words": ["alibi", "witness", "evidence"],
  "guilty_words": ["motive", "weapon", "secret"],
  "character_sheets": [
    {
      "role": "investigator",
      "character_name": "Detective Holmes",
      "occupation": "Private Investigator",
      "dark_secret": "Has a gambling problem",
      "alibi": "Was called to the scene at midnight",
      "image_path": "images/holmes.jpg"
    },
    ...
  ]
}
```
