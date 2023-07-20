"use strict";
const MongoClient = require('mongodb').MongoClient;
const MONGODB_URI = props.env.MONGO_DB_LINK; // or Atlas connection string

let cachedDb = null;


function connectToDatabase (uri) {

  console.log('=> connect to database');



  if (cachedDb) {

    console.log('=> using cached database instance');

    return Promise.resolve(cachedDb);

  }


  
     
    return MongoClient.connect(uri)
    .then(client => {
      
      var db = client.db('melbourne_cbd_places');
      cachedDb = db;
      return cachedDb;
    });

}


function queryDatabase (db, geomatry) {
  console.log('=> query database' + db);

  return db.collection('places').find({ 'location':
        { $geoWithin:
        { $geometry: geomatry }
        }
      }).toArray()
    .then((result) => { 
      result = result.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)
      return { statusCode: 200, body: JSON.stringify(result), headers: {
      'Access-Control-Allow-Origin': '*',
    } }; })
    .catch(err => {
      console.log('=> an error occurred: ', err);
      return { statusCode: 500, body: 'error' };
    });
}

module.exports.nearByPlaces = (event, context, callback) => {
 console.log('event: ', event);
  context.callbackWaitsForEmptyEventLoop = false;
  const params = JSON.parse(event.body);
   console.log('params: ', params);
  const geomatry = params.geometry


  connectToDatabase(MONGODB_URI)
    .then(db => queryDatabase(db,geomatry))
    .then(result => {
      console.log('=> returning result: ', result);
      callback(null, result);
    })
    .catch(err => {
      console.log('=> an error occurred: ', err);
      callback(err);
    });
};
