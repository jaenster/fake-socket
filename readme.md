# fake-node-socket

When writing unit tests, i get pretty annoyed i cant test with an actual socket.

So, i write a small lib that fakes a socket so i can use unit as if it was an actual socket. Currently the close/open stuff isnt implemented and its pretty basic.

This code comes straight from the unit test:

```typescript
import {Socket} from "net";
import {FakeSocket} from "fake-node-socket"


(async function () {
    // the payload
    const testData = Buffer.from([1, 3, 3, 7]);

    // To show typescript really believes they are Socket objects
    const sockets: Socket[] = FakeSocket.createPair();

    const [one, two] = sockets;

    const recved = await new Promise(resolve => {
        // hook on the data event of the first socket
        one.on('data', data => resolve(data));

        // write data over the second socket
        two.write(testData);
    });

    console.log(recved === testData); // true, its even the same Buffer object
})();
```