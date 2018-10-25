var log = require('logger')('service-locations');
var bodyParser = require('body-parser');

var errors = require('errors');
var mongutils = require('mongutils');
var auth = require('auth');
var throttle = require('throttle');
var serandi = require('serandi');

var Locations = require('model-locations');

var validators = require('./validators');
var sanitizers = require('./sanitizers');


module.exports = function (router, done) {
    router.use(serandi.many);
    router.use(serandi.ctx);
    router.use(auth({
        GET: [
            '^\/$',
            '^\/.*'
        ]
    }));
    router.use(throttle.apis('locations'));
    router.use(bodyParser.json());

    /**
     * {"name": "serandives app"}
     */
    router.post('/', validators.create, sanitizers.create, function (req, res, next) {
        Locations.create(req.body, function (err, location) {
            if (err) {
                return next(err);
            }
            res.locate(location.id).status(201).send(location);
        });
    });

    router.get('/:id', validators.findOne, sanitizers.findOne, function (req, res, next) {
        mongutils.findOne(Locations, req.query, function (err, location) {
            if (err) {
              return next(err);
            }
            res.send(location);
        });
    });

    router.put('/:id', validators.update, sanitizers.update, function (req, res, next) {
        mongutils.update(Locations, req.query, req.body, function (err, location) {
          if (err) {
            return next(err);
          }
          res.locate(location.id).status(200).send(location);
        });
    });

    /**
     * /locations?data={}
     */
    router.get('/', validators.find, sanitizers.find, function (req, res, next) {
        mongutils.find(Locations, req.query.data, function (err, locations, paging) {
            if (err) {
                return next(err);
            }
            res.many(locations, paging);
        });
    });

    router.delete('/:id', validators.findOne, sanitizers.findOne, function (req, res, next) {
      mongutils.remove(Locations, req.query, function (err) {
        if (err) {
          return next(err);
        }
        res.status(204).end();
      });
    });

    done();
};

