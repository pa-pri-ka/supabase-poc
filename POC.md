# Self-hosted Supabase Proof-Of-Concept

This POC aims at establishing how much of a full-fledged front-end application can be done using Supabase (see scope below).

It doesn't take into consideration some good practices, such as separating the Single Page Application web server, or the REST API services, from Supabase.

The objective is to establish whether we can start a simple infrastructure focusing on Supabase's features, and later scale it to adapt it to new requirements and challenges.

## Scope

### Serving the application

- serve a html + JavaScript + css website
- deployment automation
- code bundling (esbuild, Vite, Rollup or any other bundler)
- hide ugly URL that calls a function to serve the app
- secure everything

- setup a REST API that limits a user's actions (instead of allowing a user to change a supabase-js built query or a Request)
- secure REST API ?

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
- copy the single-page application's structure into it (index.html, css folder, js folder, assets...)
- create a "serve" edge function (index.ts)
- point the browser to "http://localhost:8000/functions/v1/serve/" (where the "serve" edge function is)
