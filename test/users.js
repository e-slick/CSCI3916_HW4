let envPath = __dirname + "/../.env"
require('dotenv').config({path:envPath})
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
var User = require('../Users');
let should = chai.should();

chai.use(chaiHttp);


let login_details = {
    'name': 'test',
    'username': 'email@email.com',
    'password': '123@abc'
}

describe('Register, login, check token', () => {
    beforeEach((done) => {
        done();
    });

    after((done) => {
        User.deleteOne({ name: 'test' }, function(err, user) {
            if (err) throw err;
        });
        done();
    });

describe('/signup ', () => {
    it('it should Register, Login, and check token', (done) => {
    chai.request(server)
        .post('/signup')
        .send(login_details)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.success.should.be.eql(true);
            console.log('signup')
            chai.request(server)
                .post('/signin')
                .send(login_details)
                .end((err, res) => {
                    console.log('this was run the login part');
                    res.should.have.status(200);
                    res.body.should.have.property('token');

                    let token = res.body.token;
                    console.log(token);
                    chai.request(server)
                        .post('/postjwt')
                        .set('Authorization', token)
                        .send({ echo: '' })
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('echo');
                            done();
                        })
                });
        });
    });
});
});