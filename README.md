# load-testing

## Build

With npm v5.2.0 or greater, run `npx webpack`. This will build the k6 testing
file under `dist/`.

## Test

The host and port can be set through the `K6_HOST` and `K6_PORT` environment
variables. These default to `localhost` and `80` respectively.

Run the testing file with environment variables set, e.g., 
`K6_HOST=localhost K6_PORT=80 k6 run dist/[file].js`.
