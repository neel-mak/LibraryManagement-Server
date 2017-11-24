module.exports = {
  "development": {
    //TODO: replace this with actual database
    database:{
      "username": "consumesafe", 
      "password": "ConsumeSafe123",
      "database": "consumesafedb",
      "host" : "consumesafe.cb17gye1ruth.us-west-1.rds.amazonaws.com",
      "port": "5432",
      "dialect": "postgres"
   }
  },
  "local": {
    database:{
      "username": "postgres",
      "password": "mypassword",
      "database": "consumesafe",
      "host" : "localhost",
      "port": "5432",
      "dialect": "postgres"
   }
  }
}
