# Pipeline Runner

## Overview

The Pipeline Runner executes squads step by step, managing agent handoffs, checkpoints, and outputs.

## Execution Flow

1. Load `squad.yaml` and parse the pipeline steps
2. Load `squad-party.csv` and resolve each agent's `.agent.md` persona
3. Load company context from `_opensquad/_memory/company.md`
4. Load squad memory from `squads/{name}/_memory/memories.md`
5. Execute each step in sequence

## Step Types

- **task**: Execute an agent task inline
- **checkpoint**: Pause and ask the user for input/approval (ALWAYS use AskUserQuestion)
- **subagent**: Dispatch work to a background agent
- **output**: Save results to `squads/{name}/output/`

## Checkpoint Rules

- All checkpoints MUST use AskUserQuestion
- Combine multiple questions into a single AskUserQuestion call (max 4 slots)
- Free-text questions: extract 2–3 examples as options; "Other" is added automatically
- Never skip checkpoints

## Output

- Save all generated content to `squads/{name}/output/{step-name}/`
- Update `squads/{name}/_memory/memories.md` after each run with key learnings
- Report completion summary to user
