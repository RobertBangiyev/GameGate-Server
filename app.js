const express = require('express');
const app = express();
const apiRoute = require('./routes/apiRouter');

app.listen(5000);

app.get('/', (req, res) => {
    res.redirect('/api');
})

app.use('/api', apiRoute);