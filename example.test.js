describe('#sum0()', function () {

    it('high memory and execution time', function () {
        for (let index = 0; index < 1000; index++) {
            let array = new Array(1000000).fill(0);
            let sum = array.reduce((acc, val) => acc + val, 0);            
        }

    });

});
