const test = require('tape')
const { 'api-bigquery': bq } = require('.')

//
// Create a mock request and response method
//

function status (code) {
  this.statusCode = code
  return this
}

function send (obj) {
  const body = { ...this, ...obj }
  return body
}

function set (value) {
  this[value] = value
  return this
}

const res = {
  status,
  send,
  set
}

const generateRows = (num) => {
  const rows = []

  const name = (len) => {
    let text = ''
    let alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    for (var i = 0; i < len; i++) {
      text += alpha.charAt(Math.floor(Math.random() * alpha.length))
    }
    return text
  }

  while (num--) {
    rows.push({
      Name: name(Math.floor(Math.random() * 10)),
      Age: Math.floor(Math.random() * 80),
      Weight: Math.floor(Math.random() * 250),
      IsTall: !!(Math.floor(Math.random() * 10) % 2)
    })
  }
  return rows
}

const project = process.env.PROJECT || ''
const now = Date.now().toString()
const dataset = 'test_dataset_' + now
const tableName = 'test_table_name_' + now
const rows = generateRows(100)

test('sanity', t => {
  t.ok(true)
  t.end()
})

test('pass - create dataset', async t => {
  const req = {
    body: {
      dataset
    },
    method: 'POST'
  }
  const { err, data, statusCode } = await bq(req, res)
  t.ok(!err)
  t.ok(data)
  t.equals(statusCode, 200)
  t.equals(data, req.body.dataset)
  t.end()
})

test('pass - create table', async t => {
  const schema = 'Name:string, Age:integer, Weight:float, IsTall:boolean'

  const options = {
    schema,
    location: 'US'
  }

  const req = {
    body: {
      dataset,
      tableName,
      create: {
        options
      }
    },
    method: 'POST'
  }
  const { err, data, statusCode } = await bq(req, res)
  t.ok(!err)
  t.ok(data)
  t.equals(statusCode, 200)
  t.equals(data, req.body.tableName)
  t.end()
})

test('pass - insert rows', async t => {
  const req = {
    body: {
      dataset,
      tableName,
      insert: true,
      rows
    },
    method: 'POST'
  }

  const { err, data, statusCode } = await bq(req, res)
  t.ok(!err)
  t.ok(data)
  t.equals(statusCode, 200)
  t.deepEquals(data, [ { kind: 'bigquery#tableDataInsertAllResponse' } ])
  t.end()
})

test('pass - run query', async t => {
  const query = `SELECT * FROM \`${project}.${dataset}.${tableName}\` 
  WHERE weight > 0 LIMIT 80;`

  const options = {
    query,
    location: 'US' // must match
  }

  const req = {
    body: {
      dataset,
      tableName,
      runQuery: {
        options
      }
    },
    method: 'POST'
  }
  const { err, data, statusCode } = await bq(req, res)
  t.ok(!err)
  t.ok(data)
  t.equals(statusCode, 200)
  t.ok(Array.isArray(data))
  t.equals(data.length, 80)
  t.end()
})

test('pass - delete table', async t => {
  const req = {
    method: 'DELETE',
    body: {
      dataset,
      tableName
    }
  }
  const { err, data, statusCode } = await bq(req, res)
  t.ok(!err)
  t.ok(data)
  t.equals(statusCode, 200)
  t.deepEquals(data, { body: '', status: 204, message: 'No Content' })
  t.end()
})

test('pass - delete dataset', async t => {
  const req = {
    method: 'DELETE',
    body: {
      dataset
    }
  }
  const { err, data, statusCode } = await bq(req, res)
  t.ok(!err)
  t.ok(data)
  t.equals(statusCode, 200)
  t.deepEquals(data, { body: '', status: 204, message: 'No Content' })
  t.end()
})

test('fail - insert', async t => {
  const req = {}
  const { err, data, statusCode } = await bq(req, res)
  t.ok(err)
  t.ok(!data)
  t.equals(statusCode, 404)
  t.equals(err, `Dataset name required.`)
  t.end()
})
