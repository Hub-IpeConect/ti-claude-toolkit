# Skills Engine

## Overview

The Skills Engine manages skills that can be attached to squads to extend their capabilities.

## Skills Menu

When activated, present via AskUserQuestion:
1. **View installed skills** — List skills in `_opensquad/skills/`
2. **Install a skill** — Browse catalog and install
3. **Create a custom skill** — Build a new skill for this squad
4. **Remove a skill** — Uninstall an existing skill

## Skill Structure

Each skill lives in `_opensquad/skills/{name}/` with:
- `skill.md` — Instructions and persona
- `config.yaml` — Configuration and metadata

## Operations

### View Installed Skills
- Read all directories in `_opensquad/skills/`
- Display name, description, and status for each

### Install a Skill
- Search the toolkit catalog at `~/.claude/skills/`
- Copy skill files to `_opensquad/skills/{name}/`
- Register in squad YAML if applicable

### Create a Custom Skill
- Prompt user for skill name, description, and instructions
- Generate `skill.md` and `config.yaml`
- Save to `_opensquad/skills/{name}/`

### Remove a Skill
- Confirm with user before deletion
- Remove skill directory and deregister from squads
