<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
# gym_management
>>>>>>> dec7748ad43499bf6987bdc46be6e9c2d6323223


```
gym-management
├─ api
│  ├─ controllers
│  │  ├─ auth
│  │  │  └─ index.ts
│  │  ├─ gyms
│  │  │  └─ index.ts
│  │  ├─ index.ts
│  │  ├─ members
│  │  │  └─ index.ts
│  │  └─ payments
│  │     └─ index.ts
│  ├─ db
│  │  ├─ client.ts
│  │  ├─ config.ts
│  │  ├─ generated
│  │  │  └─ prisma
│  │  │     ├─ client.d.ts
│  │  │     ├─ client.js
│  │  │     ├─ default.d.ts
│  │  │     ├─ default.js
│  │  │     ├─ edge.d.ts
│  │  │     ├─ edge.js
│  │  │     ├─ index-browser.js
│  │  │     ├─ index.d.ts
│  │  │     ├─ index.js
│  │  │     ├─ package.json
│  │  │     ├─ query_compiler_fast_bg.js
│  │  │     ├─ query_compiler_fast_bg.wasm
│  │  │     ├─ query_compiler_fast_bg.wasm-base64.js
│  │  │     ├─ runtime
│  │  │     │  ├─ client.d.ts
│  │  │     │  ├─ client.js
│  │  │     │  ├─ index-browser.d.ts
│  │  │     │  ├─ index-browser.js
│  │  │     │  └─ wasm-compiler-edge.js
│  │  │     ├─ schema.prisma
│  │  │     ├─ wasm-edge-light-loader.mjs
│  │  │     └─ wasm-worker-loader.mjs
│  │  └─ prisma
│  │     └─ schema.prisma
│  ├─ index.ts
│  ├─ middleware
│  │  ├─ auth.ts
│  │  └─ index.ts
│  ├─ models
│  │  ├─ index.ts
│  │  ├─ member
│  │  │  └─ index.ts
│  │  └─ user
│  │     └─ index.ts
│  ├─ routers
│  │  └─ index.ts
│  ├─ types
│  │  ├─ auth
│  │  │  └─ index.ts
│  │  ├─ gyms
│  │  │  └─ index.ts
│  │  ├─ index.ts
│  │  ├─ members
│  │  │  └─ index.ts
│  │  ├─ payments
│  │  │  └─ index.ts
│  │  ├─ shared
│  │  │  └─ index.ts
│  │  ├─ subscription
│  │  │  └─ index.ts
│  │  └─ users
│  │     └─ index.ts
│  └─ utils
│     ├─ config.ts
│     ├─ index.ts
│     ├─ request.ts
│     └─ response.ts
├─ app
│  ├─ api
│  │  └─ auth
│  │     ├─ login
│  │     │  └─ route.ts
│  │     └─ signup
│  │        └─ route.ts
│  ├─ dashboard
│  │  ├─ members
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ readme.txt
│  │  └─ trainers
│  │     └─ page.tsx
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ login
│  │  ├─ page.tsx
│  │  └─ readme.txt
│  ├─ page.tsx
│  └─ register
│     └─ page.tsx
├─ components
│  ├─ Card.tsx
│  ├─ layout.tsx
│  ├─ Navbar.tsx
│  ├─ page.tsx
│  └─ Sidebar.tsx
├─ eslint.config.mjs
├─ gym_management
│  └─ README.md
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ prisma.config.ts
├─ public
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ images
│  │  ├─ gym-login-bg.jpg
│  │  └─ peakpulse.png
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
├─ tailwind.config.js
└─ tsconfig.json

```