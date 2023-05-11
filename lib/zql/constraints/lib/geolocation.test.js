import tap from 'tap';
import { geolocation } from './geolocation.js';

const tests = [
    {
        input: { key: 'geolocation', val: "within(radius:10,units:'kilometers',lat:40.00,lng:-120" },
        output: {
            "constraint": 'materialCitationsRtree.minX BETWEEN @min_lng AND @max_lng AND materialCitationsRtree.minY BETWEEN @min_lat AND @max_lat',
            "debug": 'materialCitationsRtree.minX BETWEEN -120.11739786794394 AND -119.88260213205605 AND materialCitationsRtree.minY BETWEEN 39.91006796362754 AND 40.08993203637245',
            "runparams": {
                min_lng: -120.11739786794394,
                min_lat: 39.91006796362754,
                max_lng: -119.88260213205605,
                max_lat: 40.08993203637245
            }
        }
    }
];

tap.test('geolocation constraints', tap => {
    tests.forEach(test => {
        tap.same(
            geolocation(test.input), 
            test.output, 
            `geolocation(${JSON.stringify(test.input)}) is ok`
        );
    });

    tap.end();
});