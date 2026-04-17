import SwaggerUI from '@/components/SwaggerUI';

export const metadata = {
  title: 'API Documentation | Gym Management',
  description: 'Interactive API documentation for Super Admin and Gym Admin APIs',
};

export default function ApiDocsPage() {
  return (
    <main style={{ padding: '20px' }}>
      <h1>Gym Management API Documentation</h1>
      <hr />
      <SwaggerUI />
    </main>
  );
}
