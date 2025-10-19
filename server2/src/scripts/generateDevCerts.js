// src/scripts/generateDevCerts.js
import { generateDevelopmentCertificates, checkHTTPSStatus } from '../config/httpsConfig.js';

async function main() {
  console.log('🔒 ShelfQuest Development HTTPS Certificate Generator');
  console.log('==================================================');

  try {
    // Check current status
    console.log('📊 Checking current HTTPS status...');
    const status = checkHTTPSStatus();

    console.log(`Environment: ${status.environment}`);
    console.log(`HTTPS Enabled: ${status.httpsEnabled ? '✅' : '❌'}`);
    console.log(`Certificate Status: ${status.certificateStatus}`);

    if (status.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      status.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    // Generate certificates if needed
    if (status.environment === 'development' && status.certificateStatus !== 'dev-ready') {
      console.log('\n🔧 Generating development certificates...');
      const { keyPath, certPath } = await generateDevelopmentCertificates();

      console.log('\n✅ Development HTTPS setup complete!');
      console.log('\n🎯 Next steps:');
      console.log('1. Add ENABLE_DEV_HTTPS=true to your .env file');
      console.log('2. Restart your server with: npm run dev:https');
      console.log('3. Visit: https://localhost:5443 (accept security warning)');
      console.log('\n📋 Files created:');
      console.log(`  - Private Key: ${keyPath}`);
      console.log(`  - Certificate: ${certPath}`);
      console.log('\n⚠️  Browser Security Warning:');
      console.log('   You will see a security warning in your browser');
      console.log('   Click "Advanced" → "Proceed to localhost (unsafe)"');
      console.log('   This is normal for self-signed development certificates');

    } else if (status.certificateStatus === 'dev-ready') {
      console.log('\n✅ Development certificates already exist!');
      console.log('\n🎯 To enable HTTPS:');
      console.log('1. Add ENABLE_DEV_HTTPS=true to your .env file');
      console.log('2. Run: npm run dev:https');
    } else {
      console.log('\n✅ HTTPS configuration looks good!');
    }

  } catch (error) {
    console.error('\n❌ Certificate generation failed:', error.message);
    console.log('\n🔧 Alternative methods:');
    console.log('\n📋 Manual OpenSSL Commands:');
    console.log('mkdir certificates');
    console.log('openssl genrsa -out certificates/dev-key.pem 2048');
    console.log('openssl req -new -x509 -key certificates/dev-key.pem -out certificates/dev-cert.pem -days 365 -subj "/CN=localhost"');
    console.log('\n🌐 Or use mkcert (easier):');
    console.log('1. Install mkcert: https://github.com/FiloSottile/mkcert');
    console.log('2. Run: mkcert -install');
    console.log('3. Run: mkcert localhost 127.0.0.1');
    console.log('4. Move files to certificates/ directory');

    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});