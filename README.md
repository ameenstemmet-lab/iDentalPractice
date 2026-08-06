# iDentalPractice

Practice management software for modern dental clinics.

## Stack

- [Next.js 15](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com)

## Getting Started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
src/
├── app/
│   ├── (marketing)/     # public marketing pages
│   ├── (auth)/          # login, register, password reset
│   ├── (dashboard)/     # authenticated app shell (patients, appointments, billing, settings)
│   └── api/             # route handlers
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/            # shell, sidebar, header, footer
│   ├── shared/            # generic reusable components
│   ├── forms/             # shared form building blocks
│   └── providers/         # theme provider, context providers
├── features/              # domain-driven feature modules (auth, patients, appointments, billing, dashboard)
├── lib/
│   ├── supabase/           # Supabase client/server helpers
│   ├── validations/        # schema validation
│   └── utils.ts
├── hooks/                 # shared React hooks
├── types/                 # shared TypeScript types
├── config/                # site + navigation config
├── constants/             # shared constants
└── styles/                # additional stylesheets
```
