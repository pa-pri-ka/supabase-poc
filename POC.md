# Self-hosted Supabase Proof-Of-Concept

This POC aims at establishing how much of a full-fledged front-end application can be done using Supabase (see scope below).

It doesn't take into consideration some good practices, such as separating the Single Page Application web server, or the REST API services, from Supabase.

The objective is to establish whether we can start a simple infrastructure focusing on Supabase's features, and later scale it to adapt it to new requirements and challenges.

## Scope

- serve a html + JavaScript + css website

- access the database API using the JavaScript client library
- access the database API using REST
- use an Edge Function to restrict REST API access for better security on what the user can do, and disable REST access completely from the outside (Kong)
- disable postgREST and use DB connections in Edge Functions


## Installation

Supabase was installed on Windows for this POC, which was a bit quirky. Supabase is clearly conceived for Linux, even though they provide Windows and MacOS guidance.

Supabase was installed as a Docker, as recommended in Supabase's docs.

## Using Supabase

```bash
docker compose up -d --wait
docker compose down
docker compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml up -d # dev mode
sh reset.sh
```

- [Studio Dashboard URL](http://localhost:8000)

## Serving a Single-Page Application

Steps:
- create a public bucket and restrict its MIME types to `text/html, text/css, text/javascript`
- create a "serve" edge function (index.ts)
- point the browser to "http://localhost:8000/functions/v1/serve/" (where the edge function is)

