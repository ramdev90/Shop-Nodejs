const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const cors=require('cors');
require('dotenv').config()

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = process.env.MONGOURI;

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');


const authRoutesRest = require('./A_restApi/routes/auth');
const shopRoutesRest = require('./A_restApi/routes/shop');
const adminRoutesRest = require('./A_restApi/routes/admin');

// Body parsing middleware for rest api
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json())

const options = {
  origin: 'http://localhost:3000',
  }
  app.use(cors(options))


// end rest api Import

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
// app.use(csrfProtection);
app.use(flash());

// app.use((req, res, next) => {
//   res.locals.isAuthenticated = req.session.isLoggedIn;
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });

app.use((req, res, next) => {
  // throw new Error('Sync Dummy');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use('/api', authRoutesRest);
app.use('/api', shopRoutesRest);
app.use('/api/admin', adminRoutesRest);

// app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).render(...);
  // res.redirect('/500');
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
  });
});

mongoose
  .connect(MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(result => {
    console.log("db connected")
    app.listen(3001);
  })
  .catch(err => {
    console.log(err);
  });
