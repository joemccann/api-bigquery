# SYNOPSIS

🕵🏼‍♀️ An opinionated set of Google Cloud Functions APIs for interacting with BigQuery.

## REQUIREMENTS

1. A Google Cloud Account.
2. Billing Enabled.
3. API Access Enabled.
4. `gcloud` CLI installed and in your `$PATH`.
5. A preferred configuration created ( `gcloud init` ).

## USAGE

```sh
curl https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-bigquery --data '{"dataset": "my_dataset"}' -H "Content-Type: application/json"
```

The expected response:

```js
{
  "data": "my_dataset"
}
```

Or in the case there is a failure:

```js
{
  "err": "Dataset name required."
}
```

## API

> NOTE: All endpoints require a `POST` or `DELETE` method.

```sh
# Create Dataset
curl https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-bigquery --data '{"dataset": "my_dataset"}' -H "Content-Type: application/json"

# Create Table

curl https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-bigquery --data '{"dataset": "my_dataset", "tableName": "my_table", "create": {"options": { "schema": "Name:string, Age:integer, Weight:float, IsTall:boolean", "location": "US" }}}' -H "Content-Type: application/json"

# Insert Rows
curl https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-bigquery --data '{"dataset": "my_dataset", "tableName": "my_table", "insert": true, "rows": [{"Name": "Joe", "Age": 99, "Weight": 200, "IsTall": true}]}' -H "Content-Type: application/json"

# Query Table
curl https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-bigquery --data '{"dataset": "my_dataset", "tableName": "my_table", "runQuery": {"options": {"query": "SELECT * FROM `${PROJECT}.my_dataset.my_table` WHERE weight > 50 LIMIT 20;", "location": "US"}}}' -H "Content-Type: application/json"

# Delete Table
curl -X DELETE https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-bigquery?dataset=my_dataset&tableName=my_table

# Delete Dataset
curl -X DELETE https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-bigquery?dataset=my_dataset
```

## DEPLOY

First, fork or clone this repo, then:

```sh
npm i
```

Now, deploy it GCP, run the following command in the root of this repository:

```sh
gcloud functions deploy api-bigquery --runtime nodejs10 --trigger-http --memory 128MB
```

You should receive a YAML like response in your terminal including the URL for the Cloud Function.

## TESTS

```sh
npm i -D
DEBUG=api:biquery PROJECT=${PROJECT} npm test
```

## AUTHORS

- [Joe McCann](https://twitter.com/joemccann)

## LICENSE

MIT