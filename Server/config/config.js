module.exports = {
  "development": {
    //TODO: replace this with actual database
    database:{
      "username": "cmpe277", 
      "password": "Zhang27717",
      "database": "libarymanagementdb",
      "host" : "cmpe277.crkpwroxroee.us-west-1.rds.amazonaws.com",
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
  },
  mail:{
    mailService: 'gmail',
    user:'zhang277fall17@gmail.com',
    password: 'zhang27717'
  }
}
