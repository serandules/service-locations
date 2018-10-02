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


module.exports = function (router) {
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
    router.post('/', validators.create, sanitizers.create, function (req, res) {
        Locations.create(req.body, function (err, location) {
            if (err) {
                log.error('locations:create', err);
                return res.pond(errors.serverError());
            }
            res.locate(location.id).status(201).send(location);
        });
    });

    router.get('/:id', validators.findOne, sanitizers.findOne, function (req, res) {
        mongutils.findOne(Locations, req.query, function (err, location) {
            if (err) {
                log.error('locations:find-one', err);
                return res.pond(errors.serverError());
            }
            if (!location) {
                return res.pond(errors.notFound());
            }
            res.send(location);
        });
    });

    router.put('/:id', validators.update, sanitizers.update, function (req, res) {
        Locations.findOne(req.query).exec(function (err, location) {
            if (err) {
                log.error('locations:find-one', err);
                return res.pond(errors.serverError());
            }
            if (!location) {
                return res.pond(errors.notFound());
            }
            var id = req.params.id;
            var data = req.body;
            Locations.findOneAndUpdate({
                user: req.user.id,
                _id: id
            }, data, {new: true}, function (err, location) {
                if (err) {
                    log.error('locations:find-one-and-update', err);
                    return res.pond(errors.serverError());
                }
                res.locate(location.id).status(200).send(location);
            });
        });
    });


    /**
     * /locations?data={}
     */
    router.get('/', validators.find, sanitizers.find, function (req, res) {
        mongutils.find(Locations, req.query.data, function (err, locations, paging) {
            if (err) {
                log.error('locations:find', err);
                return res.pond(errors.serverError());
            }
            res.many(locations, paging);
        });
    });

    router.delete('/:id', function (req, res) {
        if (!mongutils.objectId(req.params.id)) {
            return res.pond(errors.notFound());
        }
        Locations.remove({
            user: req.user.id,
            _id: req.params.id
        }, function (err, o) {
            if (err) {
                log.error('locations:remove', err);
                return res.pond(errors.serverError());
            }
            if (!o.result.n) {
                return res.pond(errors.notFound());
            }
            res.status(204).end();
        });
    });
};

