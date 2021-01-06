// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

const router = express.Router()

// pull in Mongoose model for subscriptions
const Subscription = require('./../models/subscription')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('./../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { subscription: { title: '', text: 'foo' } } -> { subscription: { text: 'foo' } }
const removeBlanks = require('./../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)

// INDEX
// GET /subscriptions
router.get('/subscriptions', requireToken, (req, res, next) => {
  const userId = req.user._id

  Subscription.find({
    owner: userId
  })
    .then(subscriptions => {
      // `subscriptions` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return subscriptions.map(subscription => subscription.toObject())
    })
    // respond with status 200 and JSON of the subscriptions
    .then(subscriptions => res.status(200).json({ subscriptions: subscriptions }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /subscriptions/5a7db6c74d55bc51bdf39793
router.get('/subscriptions/:id', requireToken, (req, res, next) => {
  const id = req.params.id

  // req.params.id will be set based on the `:id` in the route
  Subscription.findOne({
    _id: id,
    owner: req.user._id
  })
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "subscription" JSON
    .then(subscription => res.status(200).json({ subscription: subscription.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /subscriptions
router.post('/subscriptions', requireToken, (req, res, next) => {
  // set owner of new subscription to be current user
  // grab subscription's info from request
  const subscriptionData = req.body.subscription

  subscriptionData.owner = req.user._id

  Subscription.create(subscriptionData)
    // respond to succesful `create` with status 201 and JSON of new "subscription"
    .then(subscription => {
      res.status(201).json({ subscription: subscription.toObject() })
    })
    .then(subscription => console.log(subscription))
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /subscriptions/5a7db6c74d55bc51bdf39793
router.patch('/subscriptions/:id', requireToken, removeBlanks, (req, res, next) => {
  const id = req.params.id

  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.subscription.owner

  Subscription.findOne({
    _id: id,
    owner: req.user._id
  })
    .then(handle404)
    .then(subscription => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, subscription)

      // pass the result of Mongoose's `.update` to the next `.then`
      return subscription.updateOne(req.body.subscription)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /subscriptions/5a7db6c74d55bc51bdf39793
router.delete('/subscriptions/:id', requireToken, (req, res, next) => {
  Subscription.findById(req.params.id)
    .then(handle404)
    .then(subscription => {
      // throw an error if current user doesn't own `subscription`
      requireOwnership(req, subscription)
      // delete the subscription ONLY IF the above didn't throw
      subscription.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
