import * as life from '../../src/service/life.js';

import sinon from 'sinon';
import chai  from 'chai';

const expect = chai.expect;

describe ('Life', () =>

    describe ('#answer', () => {

        it ('should be 42',     () => expect (life.answer ()).to.equal (42));

        it ('should be called', () => {
            // a non-sense test to verify that sinon-chai has been loaded correctly
            let spy = sinon.spy ();
                spy ();

            expect (spy).to.have.been.calledOnce;
        });

    })

);
