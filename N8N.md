# n8n + LangGraph

This project keeps LangGraph as the agent layer and uses n8n as the automation layer.

## Start the services

```powershell
npm.cmd run docker:infra:up
npm.cmd run api:serve
```

Open n8n:

```text
http://localhost:5678
```

Mongo Express:

```text
http://localhost:8081
```

## Import the starter workflows

In n8n, import these files:

```text
n8n-workflow-langgraph-chat.json
n8n-workflow-sales-report.json
n8n-workflow-document-extraction.json
n8n-workflow-document-upload-form.json
n8n-workflow-sales-report-upload-form.json
```

The chat workflow does this:

```text
Webhook -> HTTP Request -> LangGraph/Fastify API -> Webhook response
```

The HTTP Request node calls:

```text
http://host.docker.internal:3000/automation/chat
```

That address lets the n8n Docker container call the Node API running on your Windows host.

## Sales report workflow

The sales report workflow is the practical automation layer:

```text
Webhook -> sales report API -> alert check -> JSON response
```

It calls:

```text
http://host.docker.internal:3000/automation/sales-report
```

The API parses CSV, calculates metrics, generates alerts, saves a report in `reports/`, and returns structured JSON.

You can test the report logic locally without n8n:

```powershell
npm.cmd run sales:report
```

## Sales report upload form workflow

For the final user-facing sales flow, import:

```text
n8n-workflow-sales-report-upload-form.json
```

This workflow keeps everything together:

```text
Sales Report Form -> Generate Sales Report -> Has Alerts? -> Show Alerts / Show OK
```

The form accepts sales files:

```text
.csv, .pdf, .docx, .xlsx, .xls
```

The file must contain these columns:

```text
id, product, price, date
```

For PDF and DOCX, the API extracts the document text first, then parses the extracted sales table into the same sales report flow used by CSV and Excel.

The workflow calls:

```text
http://host.docker.internal:3000/automation/sales-report/upload
```

This is the recommended workflow for using the app as an end user.

## Document extraction workflow

The document extraction workflow receives a base64 file and extracts text from:

```text
CSV, PDF, DOCX, XLSX, XLS
```

It calls:

```text
http://host.docker.internal:3000/automation/document/extract
```

You can test the document extraction logic locally:

```powershell
npm.cmd run documents:extract
```

Use the n8n test webhook URL for `document-extraction` and send:

```json
{
  "fileName": "sample.csv",
  "mimeType": "text/csv",
  "contentBase64": "aWQscHJvZHVjdCxwcmljZQoxLHNvYXAsNS40OQoyLHJpY2UsMjIuOTA="
}
```

The response includes:

```json
{
  "document": {
    "fileName": "sample.csv",
    "type": "csv",
    "text": "...",
    "metadata": {}
  }
}
```

## Document upload form workflow

For a real user-facing upload screen, import:

```text
n8n-workflow-document-upload-form.json
```

This workflow creates an n8n form where you can choose a file from your computer. It accepts:

```text
.csv, .pdf, .docx, .xlsx, .xls
```

The form sends the uploaded file as multipart data to:

```text
http://host.docker.internal:3000/automation/document/upload
```

To use it:

```powershell
npm.cmd run docker:infra:up
npm.cmd run api:serve
```

Then open n8n, import the workflow, click the Form Trigger node, and use its test or production form URL.

## Test the chat workflow

Use the n8n test webhook URL and send:

```json
{
  "question": "Here is a CSV file called sales.csv. What's the total revenue from this sales data?\nid,product,price,date\n1,soap,5.49,2024-01-01\n2,rice,22.90,2024-01-01"
}
```

The response should be JSON:

```json
{
  "answer": "..."
}
```

## Test the sales workflow

Use the n8n test webhook URL for `sales-report` and send:

```json
{
  "alertRevenueBelow": 100,
  "topProductsLimit": 3,
  "csv": "id,product,price,date\n1,soap,5.49,2024-01-01\n2,rice,22.90,2024-01-01\n3,rice,22.90,2024-01-02"
}
```

If you omit `csv`, the API uses `data/sales-complete.csv`.

The response includes:

```json
{
  "status": "ok",
  "report": {
    "totalSales": 100,
    "totalRevenue": 1056.9,
    "averageTicket": 10.57,
    "topProducts": [],
    "alerts": [],
    "reportPath": "reports/sales-report-..."
  },
  "textReport": "..."
}
```

## Why this is useful

LangGraph decides what to do with open-ended user requests. The sales report API handles deterministic business calculations. n8n can trigger both from events, schedules, forms, emails, chat apps, CRMs, or any HTTP source, then route the answer to other systems.
