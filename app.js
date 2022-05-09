const express = require('express');
var cors = require('cors')
const app = express();
const apiRoute = require('./routes/apiRouter');

app.use(cors());

app.listen(5000);

app.get('/', (req, res) => {
    res.redirect('/api');
})

app.use('/api', apiRoute);