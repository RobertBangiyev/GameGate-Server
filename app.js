const express = require('express');
var cors = require('cors')
const app = express();

// app.use(express.json());

const apiRoute = require('./routes/apiRouter');

app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.listen(5000);

app.get('/', (req, res) => {
    res.redirect('/api');
})

app.use('/api', apiRoute);