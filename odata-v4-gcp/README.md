# odata-v4-gcp

A high-performance, stateless OData v4 to BigQuery SQL translator written in TypeScript. Designed specifically for Google Cloud BigQuery, with a focus on security (full parameterization) and cost-optimized query patterns.

## Features

- **Robust Lexer & Parser**: A hand-written Recursive Descent parser following OData v4 ABNF grammar.
- **100% Parameterization**: All literals (strings, numbers, dates) and paging limits are translated into BigQuery parameters (`@p0`, `@p1`), making it immune to SQL injection.
- **BigQuery Native Full-Text Search**: Supports the `$search` query option using BigQuery's native `SEARCH()` function.
- **Complex Projections**: Supports `$compute` for on-the-fly calculated columns with full arithmetic precedence support.
- **Nested Expansions**: Supports `$expand` with nested `$select`, `$filter`, `$top`, and `$orderby` using the BigQuery `ARRAY(SELECT AS STRUCT ...)` pattern.
- **Stateless & Portable**: Zero external dependencies (except for types), making it ideal for Cloud Functions or serverless environments.

## Architecture

The engine follows a standard compiler pipeline:
1. **Lexer**: Tokenizes the OData query string into semantic units.
2. **Parser**: Builds a strongly-typed Abstract Syntax Tree (AST).
3. **Visitor**: Traverses the AST to generate SQL dialect-specific components.
4. **Dialect (BigQuery)**: Implements the actual SQL string formatting and escaping logic.

## Supported OData Options

| Option | Description | BigQuery Pattern |
| :--- | :--- | :--- |
| `$select` | Column projection | `SELECT col1, col2` |
| `$filter` | Data filtering | `WHERE col1 = @p0` |
| `$expand` | Related data | `ARRAY(SELECT AS STRUCT ...)` |
| `$search` | Full-text search | `SEARCH(t, @p0)` |
| `$compute` | Calculated columns | `(col1 * col2) AS Alias` |
| `$orderby` | Sorting | `ORDER BY col1 DESC` |
| `$top` | Paging (limit) | `LIMIT @p0` |
| `$skip` | Paging (offset) | `OFFSET @p0` |
| `$count` | Inline count | Handled by backend envelope |

## Security

The library generates a structured `TranslationResult` containing:
- `sql`: The SQL template with placeholders.
- `params`: A record of parameter values to be passed to the BigQuery client.
- `options`: Structured query fragments (where, select, etc.) for post-processing.

**NEVER** interpolate `params` manually into the `sql` string. Always pass them to the BigQuery library's `createQueryJob` or `query` methods.

## Example

```typescript
import { Lexer, Parser, Translator, BigQueryDialect } from 'odata-v4-gcp';

const query = "$filter=Price gt 100&$select=Id,Name";
const lexer = new Lexer(query);
const tokens = lexer.tokenize();
const parser = new Parser(tokens);
const ast = parser.parse();

const dialect = new BigQueryDialect('OPTIMIZE_FOR_COST');
const translator = new Translator(dialect);
const { sql, params } = translator.translate(ast);

// sql: "SELECT `Id`, `Name` FROM `Table` WHERE (`Price` > @p0)"
// params: { "p0": 100 }
```

