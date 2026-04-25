# stackdiff

> CLI tool to diff and reconcile environment variable sets across deployment targets

## Installation

```bash
npm install -g stackdiff
```

## Usage

Compare environment variables between two deployment targets:

```bash
stackdiff diff staging production
```

Reconcile missing variables from one target into another:

```bash
stackdiff reconcile staging production --dry-run
```

### Example Output

```
~ API_URL        staging: https://api.staging.example.com
                 production: https://api.example.com

+ NEW_FEATURE_FLAG  missing in production
- DEPRECATED_KEY    missing in staging
```

### Commands

| Command | Description |
|---|---|
| `diff <source> <target>` | Show variable differences between two targets |
| `reconcile <source> <target>` | Sync missing variables from source to target |
| `list <target>` | List all variables for a target |

### Options

```
--dry-run     Preview changes without applying them
--only-missing  Show only variables absent from the target
--format      Output format: table (default), json, dotenv
```

## Configuration

stackdiff reads target definitions from a `stackdiff.config.ts` file in your project root:

```ts
export default {
  targets: {
    staging: { provider: "aws-ssm", path: "/app/staging" },
    production: { provider: "aws-ssm", path: "/app/production" },
  },
};
```

## License

MIT