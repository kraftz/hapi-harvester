'use strict'

const _ = require('lodash')
const Promise = require('bluebird')
const Joi = require('joi')
const Hapi = require('hapi')

let server, buildServer, destroyServer, hh;

const schema = {
    brands: {
        type: 'brands',
        attributes: {
            code: Joi.string().min(2).max(10),
            description: Joi.string(),
            year: Joi.number()
        }
    }
};

const data = {
    type: 'brands',
    attributes: {
        code: 'MF',
        description: 'Massey Furgeson',
        year: 2000
    }
};


//TODO just done the validation, actual includes is remaining
describe('Sparse Fieldsets', function() {
    
    beforeEach(function(done) {
        buildServer(() => {
            let promises = [];
        
            _.times(10, () => {
                promises.push(server.injectThen({method: 'post', url: '/brands', payload: {data}}))
            })
            
            return Promise.all(promises)
            .then(() => {
                done()
            })
        })
    })
    
    afterEach(function(done) {
        destroyServer(done)
    })
    
    it('Will be able to GET all from /brands with a sparse fieldset', function() {
        
        return server.injectThen({method: 'get', url: '/brands?fields[brands]=description'})
        .then((res) => {
            res.result.data.forEach((data) => {
                expect(data.id).to.match(/[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/)
                expect(data.attributes.description).to.exist;
                expect(data.attributes.code).to.not.exist;
                expect(data.attributes.year).to.not.exist;
            })
        })
    })
    
    it('Will be able to GET all from /brands with multiple fieldset', function() {
        
        return server.injectThen({method: 'get', url: '/brands?fields[brands]=code,description'})
        .then((res) => {
            res.result.data.forEach((data) => {
                expect(data.id).to.match(/[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/)
                expect(data).to.deep.equal(data)
            })
        })
    })
    
    it('Won\'t be able to GET all from /brands with multiple fieldset where one is not available in attributes', function() {
        
        return server.injectThen({method: 'get', url: '/brands?fields[foo]=bar&fields[description]=Massey Furgeson'})
        .then((res) => {
            expect(res.statusCode).to.equal(400)  
        })
    })
})

buildServer = function(done) {
    return utils.buildServer(schema)
        .then((res) => {
            server = res.server;
            hh = res.hh;
            done()
        })
}

destroyServer = function(done) {
    utils.removeFromDB(server, ['brands'])
    .then((res) => {
        server.stop(done)  
    })
}
