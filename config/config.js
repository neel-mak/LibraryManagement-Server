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
  mail:{
    mailService: 'gmail',
    user:'snaplibrary@gmail.com',
    password: 'snap123!'
  },
  "finePerDay":1
}
