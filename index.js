var log = require('logger')('service-locations');
var bodyParser = require('body-parser');

var auth = require('auth');
var throttle = require('throttle');
var serandi = require('serandi');
var model = require('model');
var Locations = require('model-locations');

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
    router.post('/',
      serandi.json,
      serandi.create(Locations),
      function (req, res, next) {
        model.create(req.ctx, function (err, location) {
            if (err) {
                return next(err);
            }
            res.locate(location.id).status(201).send(location);
        });
    });

    router.post('/:id',
      serandi.json,
      serandi.transit({
          workflow: 'model',
          model: Locations
    }));

    router.get('/:id',
      serandi.findOne(Locations),
      function (req, res, next) {
        model.findOne(req.ctx, function (err, location) {
            if (err) {
              return next(err);
            }
            res.send(location);
        });
    });

    router.put('/:id',
      serandi.json,
      serandi.update(Locations),
      function (req, res, next) {
        model.update(req.ctx, function (err, location) {
          if (err) {
            return next(err);
          }
          res.locate(location.id).status(200).send(location);
        });
    });

    /**
     * /locations?data={}
     */
    router.get('/',
      serandi.find(Locations),
      function (req, res, next) {
        model.find(req.ctx, function (err, locations, paging) {
            if (err) {
                return next(err);
            }
            res.many(locations, paging);
        });
    });

    router.delete('/:id',
      serandi.remove(Locations),
      function (req, res, next) {
        model.remove(req.ctx, function (err) {
        if (err) {
          return next(err);
        }
        res.status(204).end();
      });
    });

    done();
};

