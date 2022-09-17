[![build](https://github.com/andrew-surratt/progress-data/actions/workflows/main.yml/badge.svg)](https://github.com/andrew-surratt/progress-data/actions/workflows/main.yml)

# Progress Data
Lightweight library to get data on the progress of something

## Features

* Percent Complete
* Completion time estimate
* Averaged completion time estimate
* Datetime of above calculations

## Usage

### Example with typescript

```typescript
import {GetProgressData, Progress, ProgressCount, ProgressData} from 'progress-data';

// Mock long running task
import * as util from 'util';
const setTimeoutPromise: <T>(a: number, b: T) => Promise<T> = util.promisify(setTimeout);
let count = 0;
const pollLongRunningTask = async() => setTimeoutPromise<number>(1000, count++);

(async function(){
    //
    // Init with total
    //
    const calcProg: GetProgressData<ProgressCount> = (new Progress()).getProgress(5);
    
    //
    // Poll long running task to calculate progress
    //
    let progressData: ProgressData = calcProg(await pollLongRunningTask());
    
    while (progressData.percentComplete < 100) {
        
        progressData = calcProg(await pollLongRunningTask());
        
        console.log(`${progressData.calcDate.toISOString()}: ${progressData.percentComplete}% finished,` +
            ` ~${progressData.timeToCompInSAvgd}s to complete.`);
    }
})();
```

### Output

```
2021-08-05T22:46:01.322Z: 20% finished, ~4s to complete.
2021-08-05T22:46:02.332Z: 40% finished, ~3.02s to complete.
2021-08-05T22:46:03.337Z: 60% finished, ~2.01s to complete.
2021-08-05T22:46:04.340Z: 80% finished, ~1s to complete.
2021-08-05T22:46:05.346Z: 100% finished, ~0s to complete.
```

## Contributing

### Build
`npm run build`

### Test
`npm test`
