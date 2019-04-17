const cors = require('cors-for-cloud-functions')
const { BigQuery } = require('@google-cloud/bigquery')
const bigquery = new BigQuery()
const debug = require('debug')('api:biquery')

const del = async (args) => {
  debug('del')
  const {
    datasetId = '',
    tableName = ''
  } = args

  if (!datasetId) return { err: `Dataset ID required.` }

  //
  // Create a reference to the existing dataset
  //
  const dataset = bigquery.dataset(datasetId)

  if (tableName) {
    debug(`delete table`)
    //
    // Delete the table
    //
    try {
      const [, response] = await bigquery
        .dataset(datasetId)
        .table(tableName)
        .delete()

      const {
        body,
        statusCode: status,
        statusMessage: message
      } = response

      return { data: { body, status, message } }
    } catch (err) {
      return { err: err.message || err }
    }
  } else {
    debug(`delete dataset`)
    //
    // Delete the dataset and its contents
    //
    try {
      const [, response] = await dataset.delete({ force: true })
      const {
        body,
        statusCode: status,
        statusMessage: message
      } = response
      return { data: { body, status, message } }
    } catch (err) {
      return { err: err.message }
    }
  }
}

const insert = async (args) => {
  debug('insert')

  const {
    dataset,
    rows,
    tableName
  } = args

  try {
    const data = await bigquery
      .dataset(dataset)
      .table(tableName)
      .insert(rows)

    debug(`Inserted ${rows.length} rows`)

    return { data }
  } catch (err) {
    return { err: err.message }
  }
}

const runQuery = async (args) => {
  debug('runQuery')
  const {
    options
  } = args

  //
  // Run the query as a job
  //
  try {
    const [job] = await bigquery.createQueryJob(options)

    debug(`Job ${job.id} started.`)

    //
    // Wait for the query to finish
    //
    const [rows] = await job.getQueryResults()

    debug(`query results length`, rows.length)

    return { data: rows }
  } catch (err) {
    return { err: err.message }
  }
}

exports['api-bigquery'] = async (request, response) => {
  const { req, res, isOptions } = cors(request, response)

  if (isOptions) return res.status(204).send('')

  const {
    body = {},
    method = 'GET',
    query = {}
  } = req

  const datasetName = body.dataset || query.dataset || ''
  const tableName = body.tableName || query.tableName || ''
  const create = body.create || query.create || {}

  if (!datasetName) {
    return res.status(404).send({
      err: `Dataset name required.`
    })
  }

  if (method === 'POST') {
    if (body.runQuery) {
      const { err, data } = await runQuery(body.runQuery)

      if (err) return res.status(404).send({ err: err.message })

      return res.status(200).send({ data })
    }

    if (body.insert) {
      const { err, data } = await insert(body)

      if (err) return res.status(404).send({ err: err.message })

      return res.status(200).send({ data })
    } else {
      //
      // Create a dataset
      //
      if (tableName && create.options) {
        debug('create table')

        try {
          const [table] = await bigquery
            .dataset(datasetName)
            .createTable(tableName, create.options)

          debug(`table.id`, table.id)

          return res.status(200).send({ data: table.id })
        } catch (err) {
          return res.status(404).send({ err: err.message })
        }
      } else {
        try {
          debug('create dataset')

          const [ dataset ] = await bigquery.createDataset(datasetName)

          debug(`dataset.id`, dataset.id)

          return res.status(200).send({ data: dataset.id })
        } catch (err) {
          return res.status(404).send({ err: err.message })
        }
      }
    }
  }

  if (method === 'DELETE') {
    const { err, data } = await del({
      datasetId: datasetName,
      tableName
    })

    if (err) return res.status(404).send({ err: err.message })
    return res.status(200).send({ data })
  }

  return res.status(404).send({
    err: `BigQuery API requires a POST or DELETE for all endpoints.`
  })
}
