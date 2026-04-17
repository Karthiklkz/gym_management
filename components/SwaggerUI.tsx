'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

const ApiDocs = () => {
  // Persistence logic
  const handleOnComplete = (swaggerUi: any) => {
    // 1. Load token from localStorage on load
    const savedToken = localStorage.getItem('swagger_token');
    if (savedToken) {
      swaggerUi.preauthorizeApiKey('BearerAuth', savedToken);
    }

    // 2. Listen for "Authorize" events to save new tokens
    // Note: This uses the internal Swagger UI interceptor
  };

  const requestInterceptor = (req: any) => {
    // If the request is for the API and has an Authorization header, cache it
    if (req.url.includes('/api/') && req.headers['Authorization']) {
      const token = req.headers['Authorization'].replace('Bearer ', '');
      if (token && token.length > 20) { // Basic check to ensure it's a real JWT
        localStorage.setItem('swagger_token', token);
      }
    }
    return req;
  };

  return (
    <div className="swagger-container">
      <style jsx global>{`
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
      `}</style>
      <SwaggerUI 
        url="/api/docs" 
        onComplete={handleOnComplete}
        requestInterceptor={requestInterceptor}
        persistAuthorization={true}
      />
    </div>
  );
};

export default ApiDocs;
