# OpenAPI to site

A tool to convert an OpenAPI v3 file to a static documentation site.

## Demo

[This demo](https://openapi-to-site.netlify.app) is hosted on Netlify and is based on [this OpenAPI v3 example file](https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml).

## How it works

All this project does it combine the following tools to ultimately convert an OpenAPI file to a static site:
- [Widdershins](https://github.com/Mermade/widdershins): converts OpenAPI YAML to markdown
- [Reslate](https://github.com/Mermade/reslate): generates a static site with the markdown

[Reslate](https://github.com/Mermade/reslate) uses a static site generator called [Eleventy](https://www.11ty.dev). Reslate's theme is based on the popular [Slate](https://github.com/slatedocs/slate) project for static documentation websites.

## Getting started

1. Clone this repository with `git clone git@github.com:samjmck/openapi-to-site.git`
2. Run `cd site`
3. Install depedencies with `npm install`
4. Edit `openapi.yml` to document your API
5. Generate the site with `npm run build`
6. The site's source files will be in the `site/_site` directory

## Hosting

The generated files in `_site` can be hosted anywhere you can host a static site. Netlify, GitHub Pages, Cloudflare Pages, Vercel and GitLab Pages are all free options. [This demo site]() is being hosted on GitHub Pages.
