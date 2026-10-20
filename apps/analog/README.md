# angular

This project was generated with [Analog](https://analogjs.org), the fullstack meta-framework for Angular.

## Setup

Run `npm install` to install the application dependencies.

## Development

Run `npm start` for a dev server. Navigate to `http://localhost:3000/`. The application automatically reloads if you change any of the source files.

## Build

Run `npm run build` to build the client/server project. The client build artifacts are located in the `dist/analog/public` directory. The server for the API build artifacts are located in the `dist/analog/server` directory.

## Test

Run `npm run test` to run unit tests with [Vitest](https://vitest.dev).

## Community

- Visit and Star the [GitHub Repo](https://github.com/analogjs/analog)
- Join the [Discord](https://chat.analogjs.org)
- Follow us on [Twitter](https://twitter.com/analogjs)
- Become a [Sponsor](https://github.com/sponsors/brandonroberts)

## Halaman (SPA, siap terhubung ke backend /hono)

| Rute        | Keterangan                                |
| ----------- | ----------------------------------------- |
| `/`         | Landing                                   |
| `/login`    | Masuk (`POST /auth/login`)                |
| `/register` | Daftar (`POST /auth/register`)            |
| `/home`     | Beranda + sidebar & top bar (wajib login) |

Salin `.env.example` ke `.env` lalu atur `VITE_API_URL` ke URL backend. Sesi memakai cookie (`withCredentials`), cek sesi lewat `GET /auth/me`.
