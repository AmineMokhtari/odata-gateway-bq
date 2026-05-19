# Demo & Local Setup SQL Scripts

This directory (`scripts/sql/`) contains SQL scripts intended for manual execution by developers. These scripts are useful for:
- Creating demo datasets and tables in BigQuery.
- Simulating edge cases for local testing.
- Providing standardized data environments for presentation or exploration.

**Note:** If you are writing SQL scripts that are automatically executed during continuous integration (CI) or end-to-end (E2E) testing, please place them in `tests/fixtures/` instead.

## How to use

### Run all scripts at once
We have provided a convenient Bash script that will automatically create the dataset (if it doesn't exist) and execute every `.sql` script in this directory sequentially.

It supports optional arguments for location and project ID:

1. **Use all defaults** (location: `europe-west1`, project: current gcloud project):
   ```bash
   ./scripts/sql/run-all.sh
   ```
2. **Override location only** (e.g., `US` multi-region):
   ```bash
   ./scripts/sql/run-all.sh US
   ```
3. **Override both location and project**:
   ```bash
   ./scripts/sql/run-all.sh US my-other-project-id
   ```

### Run a single script manually
You can execute individual scripts against your local BigQuery sandbox using the `bq` command-line tool. For example:

```bash
bq query --use_legacy_sql=false < scripts/sql/insurance/customer_v1.sql
```
