import {expect} from 'chai';

import {Socket} from "net";
import {FakeSocket} from "../src";

describe('fake socket', function () {

    it('simple io', async function () {

        // the payload
        const testData = Buffer.from([1, 3, 3, 7]);

        // To show typescript really believes they are Socket objects
        const sockets: Socket[] = FakeSocket.createPair();

        const [one, two] = sockets;

        const recved = await new Promise(resolve => {
            // hook on the data event
            one.on('data', data => resolve(data));

            // hook on the data event of the first socket
            two.write(testData);
        });

        // what we received should be the same as the test data, even the same Buffer object
        expect(recved).equal(testData);

    });


});
