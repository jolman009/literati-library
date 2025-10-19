// src/config/httpsConfig.js
import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// HTTPS Configuration Options
// =====================================================

/**
 * Create HTTPS server with SSL certificates
 * @param {Express} app - Express application
 * @param {Object} options - HTTPS options
 * @returns {Object} Server configuration
 */
export const createHTTPSServer = (app, options = {}) => {
  const {
    port = process.env.PORT || 5000,
    httpsPort = process.env.HTTPS_PORT || 5443,
    keyPath = process.env.SSL_KEY_PATH,
    certPath = process.env.SSL_CERT_PATH,
    forceHTTPS = process.env.NODE_ENV === 'production'
  } = options;

  console.log('🔒 Configuring HTTPS server...');

  // Development HTTPS with self-signed certificates
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_HTTPS === 'true') {
    return createDevelopmentHTTPS(app, { port, httpsPort });
  }

  // Production HTTPS with real certificates
  if (process.env.NODE_ENV === 'production') {
    // Check if running on cloud platform (Render, Vercel, etc.)
    if (process.env.USE_CLOUD_HTTPS === 'true' || process.env.RENDER || process.env.VERCEL) {
      console.log('🏭 Cloud platform detected - using HTTP with proxy SSL termination');
      const server = http.createServer(app);
      return {
        server,
        port,
        protocol: 'http',
        start: () => {
          return new Promise((resolve) => {
            server.listen(port, () => {
              console.log(`✅ HTTP server running on port ${port} (cloud platform)`);
              resolve({ server, port, protocol: 'http' });
            });
          });
        }
      };
    }

    return createProductionHTTPS(app, { port, httpsPort, keyPath, certPath });
  }

  // Default HTTP server for development
  console.log('📡 Starting HTTP server (development mode)');
  const server = http.createServer(app);

  return {
    server,
    port,
    protocol: 'http',
    start: () => {
      return new Promise((resolve, reject) => {
        server.listen(port, () => {
          console.log(`🚀 HTTP Server running on http://localhost:${port}`);
          console.log('⚠️  For production, ensure HTTPS is configured');
          resolve({ server, port, protocol: 'http' });
        });

        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${port} is already in use. Please free the port or use a different one.`);
          }
          reject(error);
        });
      });
    }
  };
};

/**
 * Create development HTTPS server with self-signed certificates
 */
const createDevelopmentHTTPS = (app, { port, httpsPort }) => {
  console.log('🔧 Setting up development HTTPS with self-signed certificates...');

  try {
    // Try to load existing dev certificates
    const certDir = path.join(process.cwd(), 'certificates');
    const keyPath = path.join(certDir, 'dev-key.pem');
    const certPath = path.join(certDir, 'dev-cert.pem');

    let httpsOptions;

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      console.log('📜 Loading existing development certificates...');
      httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
    } else {
      console.log('⚠️  Development certificates not found');
      console.log('💡 Run: npm run generate-dev-certs to create them');

      // Fallback to HTTP for development
      const httpServer = http.createServer(app);
      return {
        server: httpServer,
        port,
        protocol: 'http',
        start: () => {
          return new Promise((resolve) => {
            httpServer.listen(port, () => {
              console.log(`🚀 HTTP Server running on http://localhost:${port}`);
              console.log('💡 To enable HTTPS in development, run: npm run generate-dev-certs');
              resolve({ server: httpServer, port, protocol: 'http' });
            });
          });
        }
      };
    }

    const httpsServer = https.createServer(httpsOptions, app);
    const httpServer = http.createServer(app);

    return {
      httpsServer,
      httpServer,
      port: httpsPort,
      httpPort: port,
      protocol: 'https',
      start: () => {
        return new Promise((resolve) => {
          // Start HTTPS server
          httpsServer.listen(httpsPort, () => {
            console.log(`🔒 HTTPS Server running on https://localhost:${httpsPort}`);

            // Start HTTP redirect server
            httpServer.listen(port, () => {
              console.log(`📡 HTTP Redirect server running on http://localhost:${port}`);
              console.log('🔄 HTTP requests will redirect to HTTPS');
              resolve({
                httpsServer,
                httpServer,
                port: httpsPort,
                httpPort: port,
                protocol: 'https'
              });
            });
          });
        });
      }
    };

  } catch (error) {
    console.error('❌ Failed to setup development HTTPS:', error.message);
    console.log('🔄 Falling back to HTTP server...');

    const httpServer = http.createServer(app);
    return {
      server: httpServer,
      port,
      protocol: 'http',
      start: () => {
        return new Promise((resolve) => {
          httpServer.listen(port, () => {
            console.log(`🚀 HTTP Server running on http://localhost:${port}`);
            resolve({ server: httpServer, port, protocol: 'http' });
          });
        });
      }
    };
  }
};

/**
 * Create production HTTPS server with real certificates
 */
const createProductionHTTPS = (app, { port, httpsPort, keyPath, certPath }) => {
  console.log('🏭 Setting up production HTTPS...');

  // Validate certificate paths
  if (!keyPath || !certPath) {
    console.error('❌ SSL certificate paths not configured');
    console.error('   Set SSL_KEY_PATH and SSL_CERT_PATH environment variables');
    throw new Error('SSL certificates required for production');
  }

  if (!fs.existsSync(keyPath)) {
    throw new Error(`SSL key file not found: ${keyPath}`);
  }

  if (!fs.existsSync(certPath)) {
    throw new Error(`SSL certificate file not found: ${certPath}`);
  }

  try {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    // Add intermediate certificates if available
    const caPath = process.env.SSL_CA_PATH;
    if (caPath && fs.existsSync(caPath)) {
      httpsOptions.ca = fs.readFileSync(caPath);
      console.log('📜 Loaded intermediate certificates');
    }

    const httpsServer = https.createServer(httpsOptions, app);
    const httpServer = http.createServer(createHTTPSRedirectApp());

    console.log('✅ Production HTTPS certificates loaded');

    return {
      httpsServer,
      httpServer,
      port: httpsPort,
      httpPort: port,
      protocol: 'https',
      start: () => {
        return new Promise((resolve) => {
          // Start HTTPS server
          httpsServer.listen(httpsPort, () => {
            console.log(`🔒 Production HTTPS Server running on https://localhost:${httpsPort}`);

            // Start HTTP redirect server
            httpServer.listen(port, () => {
              console.log(`🔄 HTTP Redirect server running on port ${port}`);
              console.log('📡 All HTTP traffic will redirect to HTTPS');
              resolve({
                httpsServer,
                httpServer,
                port: httpsPort,
                httpPort: port,
                protocol: 'https'
              });
            });
          });
        });
      }
    };

  } catch (error) {
    console.error('❌ Failed to load SSL certificates:', error.message);
    throw new Error('SSL certificate configuration failed');
  }
};

/**
 * Create app that redirects all HTTP to HTTPS
 */
const createHTTPSRedirectApp = () => {
  return (req, res) => {
    const host = req.headers.host;
    const url = `https://${host}${req.url}`;

    console.log(`🔄 Redirecting HTTP to HTTPS: ${req.url}`);

    res.writeHead(301, {
      'Location': url,
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    });
    res.end();
  };
};

// =====================================================
// Certificate Generation for Development
// =====================================================

/**
 * Generate self-signed certificates for development
 */
export const generateDevelopmentCertificates = async () => {
  console.log('🔧 Generating development SSL certificates...');

  try {
    const { execSync } = await import('child_process');
    const certDir = path.join(process.cwd(), 'certificates');

    // Create certificates directory
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
      console.log('📁 Created certificates directory');
    }

    const keyPath = path.join(certDir, 'dev-key.pem');
    const certPath = path.join(certDir, 'dev-cert.pem');

    // Generate private key
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    console.log('🔑 Generated private key');

    // Generate certificate
    const certCommand = `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=Development/L=Local/O=ShelfQuest/OU=Development/CN=localhost"`;
    execSync(certCommand, { stdio: 'inherit' });
    console.log('📜 Generated self-signed certificate');

    // Create .gitignore for certificates
    const gitignorePath = path.join(certDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, '# Ignore all certificate files\n*.pem\n*.key\n*.crt\n*.cert\n');
      console.log('📝 Created .gitignore for certificates');
    }

    console.log('✅ Development certificates generated successfully!');
    console.log(`📂 Certificates saved to: ${certDir}`);
    console.log('🔒 You can now use HTTPS in development');
    console.log('💡 Set ENABLE_DEV_HTTPS=true in your .env to enable HTTPS');

    return { keyPath, certPath };

  } catch (error) {
    console.error('❌ Failed to generate certificates:', error.message);
    console.log('');
    console.log('📋 Manual certificate generation:');
    console.log('1. Install OpenSSL if not available');
    console.log('2. Create certificates directory: mkdir certificates');
    console.log('3. Generate key: openssl genrsa -out certificates/dev-key.pem 2048');
    console.log('4. Generate cert: openssl req -new -x509 -key certificates/dev-key.pem -out certificates/dev-cert.pem -days 365');

    throw error;
  }
};

// =====================================================
// Cloud Platform HTTPS Helpers
// =====================================================

/**
 * Configure app for cloud platforms (Vercel, Railway, etc.)
 * These platforms handle SSL termination automatically
 */
export const configureCloudHTTPS = (app) => {
  console.log('☁️  Configuring for cloud platform deployment...');

  // Trust proxy headers from cloud platforms
  app.set('trust proxy', 1);

  // Middleware to enforce HTTPS in production
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
      // Check various headers that indicate HTTPS
      const isHTTPS = req.secure ||
                     req.headers['x-forwarded-proto'] === 'https' ||
                     req.headers['x-forwarded-ssl'] === 'on' ||
                     req.connection.encrypted;

      if (!isHTTPS) {
        const httpsUrl = `https://${req.headers.host}${req.url}`;
        console.log(`🔄 Redirecting to HTTPS: ${req.url}`);
        return res.redirect(301, httpsUrl);
      }
    }
    next();
  });

  console.log('✅ Cloud HTTPS configuration applied');
};

// =====================================================
// HTTPS Status Checker
// =====================================================

/**
 * Check HTTPS configuration status
 */
export const checkHTTPSStatus = () => {
  const status = {
    environment: process.env.NODE_ENV || 'development',
    httpsEnabled: false,
    certificateStatus: 'not-configured',
    recommendations: []
  };

  if (process.env.NODE_ENV === 'production') {
    // Production checks
    if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
      status.httpsEnabled = true;
      status.certificateStatus = 'configured';

      // Verify certificate files exist
      if (fs.existsSync(process.env.SSL_KEY_PATH) && fs.existsSync(process.env.SSL_CERT_PATH)) {
        status.certificateStatus = 'ready';
      } else {
        status.certificateStatus = 'files-missing';
        status.recommendations.push('SSL certificate files not found at specified paths');
      }
    } else {
      status.recommendations.push('Set SSL_KEY_PATH and SSL_CERT_PATH for production HTTPS');
    }
  } else {
    // Development checks
    const certDir = path.join(process.cwd(), 'certificates');
    const devKeyExists = fs.existsSync(path.join(certDir, 'dev-key.pem'));
    const devCertExists = fs.existsSync(path.join(certDir, 'dev-cert.pem'));

    if (devKeyExists && devCertExists) {
      status.certificateStatus = 'dev-ready';
      if (process.env.ENABLE_DEV_HTTPS === 'true') {
        status.httpsEnabled = true;
      } else {
        status.recommendations.push('Set ENABLE_DEV_HTTPS=true to enable development HTTPS');
      }
    } else {
      status.recommendations.push('Run npm run generate-dev-certs to create development certificates');
    }
  }

  return status;
};

export default {
  createHTTPSServer,
  generateDevelopmentCertificates,
  configureCloudHTTPS,
  checkHTTPSStatus
};