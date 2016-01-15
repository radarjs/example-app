var express = require('express');
var app = express();

var Radar = require('radar');
var Postgres = require('machinepack-radar-postgresql');
var CONN_STR = 'postgres://particlebanana@localhost:5432/radar-test';


//  ╔═╗╔╗╔╔═╗  ╔═╗╔═╗╔═╗  ╔═╗ ╦ ╦╔═╗╦═╗╦ ╦
//  ║ ║║║║║╣   ║ ║╠╣ ╠╣   ║═╬╗║ ║║╣ ╠╦╝╚╦╝
//  ╚═╝╝╚╝╚═╝  ╚═╝╚  ╚    ╚═╝╚╚═╝╚═╝╩╚═ ╩

app.get('/single', function(req, res) {
  Radar({ connectionString: CONN_STR, driver: Postgres })
  .select(['name', 'age'])
  .from('user')
  .exec(function(err, query) {
    if(err) {
      return res.status(500).send(err);
    }

    res.json(query);
  });
});


//  ╔╦╗╦ ╦╦ ╔╦╗╦  ╔╦╗╔═╗╔╗╔╔═╗╔╗╔╔╦╗
//  ║║║║ ║║  ║ ║───║ ║╣ ║║║╠═╣║║║ ║
//  ╩ ╩╚═╝╩═╝╩ ╩   ╩ ╚═╝╝╚╝╩ ╩╝╚╝ ╩

app.get('/multi', function(req, res) {

  var schema = req.query.tenant;
  var query = Radar({ connectionString: CONN_STR, driver: Postgres })
    .select('*')
    .from('user');

  if(schema) {
    query.schema(schema);
  }

  query.exec(function(err, query) {
    if(err) {
      return res.status(500).send();
    }

    res.json(query);
  });

});


//  ╔╦╗╦═╗╔═╗╔╗╔╔═╗╔═╗╔═╗╔╦╗╦╔═╗╔╗╔╔═╗╦
//   ║ ╠╦╝╠═╣║║║╚═╗╠═╣║   ║ ║║ ║║║║╠═╣║
//   ╩ ╩╚═╩ ╩╝╚╝╚═╝╩ ╩╚═╝ ╩ ╩╚═╝╝╚╝╩ ╩╩═╝

app.get('/transaction', function(req, res) {

  Radar.txn({ connectionString: CONN_STR, driver: Postgres }, function(err, txn) {
    if(err) {
      return res.status(500).send('ERROAR', err);
    }

    // Run a find query on the CODY schema
    txn.radar()
    .select(['name'])
    .from('user')
    .schema('cody')
    .exec(function(err, codyRecords) {
      if(err) {
        return txn.rollback(function(err) {
          return res.status(500).send(err);
        });
      }

      // Run a find query on the SCOTT schema
      txn.radar()
      .select(['name'])
      .from('user')
      .schema('scott')
      .exec(function(err, scottRecords) {
        if(err) {
          txn.rollback(function(err) {
            return res.status(500).send(err);
          });
        }

        // commit the transaction
        txn.commit(function(err) {
          if(err) {
            return res.status(500).send(err);
          }

          return res.json({
            cody: codyRecords,
            scott: scottRecords
          });
        });
      });
    });
  });

});


// Start Express
app.listen(3000);
