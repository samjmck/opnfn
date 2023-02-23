## Running locally

Using [Miniflare](https://miniflare.dev), a simulator for Cloudflare Workers, you can run the Cloudflare Worker of `opnfn` locally. You can even use a Redis server to simulate Cloudflare Workers KV.

There are 3 ways to run `opnfn` locally:
1. [Using the Docker image (without persistent storage)](#running-with-docker-without-persistent-storage)
2. [Using the Docker compose file with a Redis server (with persistent storage)](#running-with-docker-compose-with-redis-persistent-storage)

If you would like to run `opnfn` locally without using Docker, you can use Miniflare without Docker.

To do this, do the following:

1. Clone the repo with `git clone git@github.com:samjmck/opnfn.git` and cd into the directory with `cd opnfn`
2. Install the dependencies with `npm install`
3. Run Miniflare with (or without) the Redis adapter
```shell
npx wrangler build
npx miniflare dist/index.js --kv-persist redis://localhost:6379
```

### Running with Docker (without persistent storage)

1. Pull the Docker image with `docker pull samjmck/opnfn`
2. Run the Docker image with `docker run -p 8787:8787 samjmck/opnfn`

### Running with Docker compose (with Redis persistent storage)

1. Copy and paste the [`docker-compose.yml`](../docker-compose.yml) file from the repo into a directory
2. Run `docker-compose up -d`

The Redis cache data will be saved into `dump.rdb` in the working directory where the Docker compose file is located.

> Receiving a `port is already allocated` error? Try running `docker-compose down --remove-orphans` first.